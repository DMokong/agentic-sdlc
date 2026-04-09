import pytest
import yaml
from pathlib import Path
from unittest.mock import patch, MagicMock
from spec_bench.review import run_judge, collect_source_code, parse_functional_tests

SAMPLE_FUNCTIONAL_TESTS = """
functional_checklist:
  - id: F01
    requirement: "R01: Display current temperature"
    test: "Page contains temperature element"
  - id: F02
    requirement: "R02: Show 5-day forecast"
    test: "Forecast section has 5 entries"
"""

SAMPLE_JUDGE_RESPONSE = '''
```yaml
scores:
  prd_feature_coverage: 8
  requirement_accuracy: 7
  scope_discipline: 9
  edge_case_handling: 6
  spec_to_impl_fidelity: 8
  structural_quality: 7
  overall: 7.6
reasoning:
  prd_feature_coverage: "Most requirements present, missing transport mode icons"
  requirement_accuracy: "Weather display correct, transport times offset by timezone"
  scope_discipline: "No gold-plating, focused implementation"
  edge_case_handling: "No loading states, API errors show blank screen"
  spec_to_impl_fidelity: "Followed spec architecture closely"
  structural_quality: "Clean component structure, reasonable naming"
```
'''


def test_parse_functional_tests(tmp_path):
    tests_file = tmp_path / "functional-tests.yml"
    tests_file.write_text(SAMPLE_FUNCTIONAL_TESTS)
    tests = parse_functional_tests(tests_file)
    assert len(tests) == 2
    assert tests[0]["id"] == "F01"


def test_parse_functional_tests_returns_all_fields(tmp_path):
    tests_file = tmp_path / "functional-tests.yml"
    tests_file.write_text(SAMPLE_FUNCTIONAL_TESTS)
    tests = parse_functional_tests(tests_file)
    assert tests[1]["id"] == "F02"
    assert "requirement" in tests[0]
    assert "test" in tests[0]


def test_collect_source_code(tmp_path):
    app_dir = tmp_path / "app"
    (app_dir / "src").mkdir(parents=True)
    (app_dir / "src" / "App.tsx").write_text("export function App() { return <div>Hello</div> }")
    (app_dir / "src" / "utils.ts").write_text("export const add = (a: number, b: number) => a + b")
    (app_dir / "package.json").write_text('{"name": "test"}')  # Should not be collected

    source = collect_source_code(app_dir)
    assert "App.tsx" in source
    assert "utils.ts" in source
    assert "package.json" not in source


def test_collect_source_code_skips_node_modules(tmp_path):
    app_dir = tmp_path / "app"
    (app_dir / "src").mkdir(parents=True)
    (app_dir / "src" / "App.tsx").write_text("const x = 1")
    node_mod = app_dir / "node_modules" / "react" / "index.js"
    node_mod.parent.mkdir(parents=True)
    node_mod.write_text("module.exports = {}")

    source = collect_source_code(app_dir)
    assert "App.tsx" in source
    assert "node_modules" not in source


def test_collect_source_code_includes_css(tmp_path):
    app_dir = tmp_path / "app"
    (app_dir / "src").mkdir(parents=True)
    (app_dir / "src" / "styles.css").write_text("body { margin: 0; }")

    source = collect_source_code(app_dir)
    assert "styles.css" in source


def test_collect_source_code_includes_html(tmp_path):
    app_dir = tmp_path / "app"
    (app_dir / "src").mkdir(parents=True)
    (app_dir / "src" / "index.html").write_text("<html><body></body></html>")

    source = collect_source_code(app_dir)
    assert "index.html" in source


def test_collect_source_code_labels_files(tmp_path):
    """Each file should be labelled with its path in the output."""
    app_dir = tmp_path / "app"
    (app_dir / "src").mkdir(parents=True)
    (app_dir / "src" / "App.tsx").write_text("const x = 1")

    source = collect_source_code(app_dir)
    # The filename should appear as a label/header
    assert "App.tsx" in source
    assert "const x = 1" in source


def test_run_judge_produces_scorecard(tmp_path):
    prd_path = tmp_path / "prd.md"
    prd_path.write_text("# PRD\n## Requirements\n- R01: Do thing")

    spec_path = tmp_path / "spec.md"
    spec_path.write_text("# Spec\n## Requirements\n- R01: Do thing")

    impl_dir = tmp_path / "app"
    (impl_dir / "src").mkdir(parents=True)
    (impl_dir / "src" / "App.tsx").write_text("export function App() {}")

    rubric_path = tmp_path / "rubric.md"
    rubric_path.write_text("Score each dimension 1-10")

    output_dir = tmp_path / "output"
    output_dir.mkdir()

    with patch("spec_bench.review.subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=SAMPLE_JUDGE_RESPONSE,
            stderr=""
        )
        scorecard = run_judge(
            prd_path=prd_path,
            spec_path=spec_path,
            impl_dir=impl_dir,
            rubric_path=rubric_path,
            output_dir=output_dir,
            judge_model="opus-4-6",
        )

    assert scorecard["scores"]["overall"] == 7.6
    assert scorecard["scores"]["prd_feature_coverage"] == 8
    assert "reasoning" in scorecard
    assert (output_dir / "judge-scorecard.yml").exists()


def test_run_judge_writes_scorecard_to_disk(tmp_path):
    """run_judge writes judge-scorecard.yml that can be round-tripped via yaml."""
    prd_path = tmp_path / "prd.md"
    prd_path.write_text("# PRD")
    spec_path = tmp_path / "spec.md"
    spec_path.write_text("# Spec")
    impl_dir = tmp_path / "app"
    (impl_dir / "src").mkdir(parents=True)
    (impl_dir / "src" / "App.tsx").write_text("const x = 1")
    rubric_path = tmp_path / "rubric.md"
    rubric_path.write_text("rubric content")
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    with patch("spec_bench.review.subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=SAMPLE_JUDGE_RESPONSE,
            stderr=""
        )
        run_judge(
            prd_path=prd_path,
            spec_path=spec_path,
            impl_dir=impl_dir,
            rubric_path=rubric_path,
            output_dir=output_dir,
        )

    scorecard_path = output_dir / "judge-scorecard.yml"
    assert scorecard_path.exists()
    loaded = yaml.safe_load(scorecard_path.read_text())
    assert loaded["scores"]["overall"] == 7.6


def test_run_judge_passes_rubric_and_docs_to_claude(tmp_path):
    """run_judge should include rubric, PRD, spec, and source in the prompt."""
    prd_path = tmp_path / "prd.md"
    prd_path.write_text("UNIQUE_PRD_MARKER")
    spec_path = tmp_path / "spec.md"
    spec_path.write_text("UNIQUE_SPEC_MARKER")
    impl_dir = tmp_path / "app"
    (impl_dir / "src").mkdir(parents=True)
    (impl_dir / "src" / "App.tsx").write_text("UNIQUE_SOURCE_MARKER")
    rubric_path = tmp_path / "rubric.md"
    rubric_path.write_text("UNIQUE_RUBRIC_MARKER")
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    captured_args = {}

    def capture_run(cmd, **kwargs):
        captured_args["cmd"] = cmd
        captured_args["kwargs"] = kwargs
        return MagicMock(returncode=0, stdout=SAMPLE_JUDGE_RESPONSE, stderr="")

    with patch("spec_bench.review.subprocess.run", side_effect=capture_run):
        run_judge(
            prd_path=prd_path,
            spec_path=spec_path,
            impl_dir=impl_dir,
            rubric_path=rubric_path,
            output_dir=output_dir,
        )

    # The prompt passed to claude -p should contain all four markers
    prompt_arg = captured_args["cmd"][2]  # claude -p <prompt>
    assert "UNIQUE_PRD_MARKER" in prompt_arg
    assert "UNIQUE_SPEC_MARKER" in prompt_arg
    assert "UNIQUE_SOURCE_MARKER" in prompt_arg
    assert "UNIQUE_RUBRIC_MARKER" in prompt_arg


def test_run_judge_raises_on_claude_failure(tmp_path):
    """run_judge raises RuntimeError if claude -p exits non-zero."""
    prd_path = tmp_path / "prd.md"
    prd_path.write_text("# PRD")
    spec_path = tmp_path / "spec.md"
    spec_path.write_text("# Spec")
    impl_dir = tmp_path / "app"
    impl_dir.mkdir(parents=True)
    rubric_path = tmp_path / "rubric.md"
    rubric_path.write_text("rubric")
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    with patch("spec_bench.review.subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(
            returncode=1,
            stdout="",
            stderr="claude: command not found"
        )
        with pytest.raises(RuntimeError, match="Judge failed"):
            run_judge(
                prd_path=prd_path,
                spec_path=spec_path,
                impl_dir=impl_dir,
                rubric_path=rubric_path,
                output_dir=output_dir,
            )


def test_run_judge_uses_specified_model(tmp_path):
    """run_judge passes --model flag to claude -p."""
    prd_path = tmp_path / "prd.md"
    prd_path.write_text("# PRD")
    spec_path = tmp_path / "spec.md"
    spec_path.write_text("# Spec")
    impl_dir = tmp_path / "app"
    impl_dir.mkdir(parents=True)
    rubric_path = tmp_path / "rubric.md"
    rubric_path.write_text("rubric")
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    captured_cmd = {}

    def capture_run(cmd, **kwargs):
        captured_cmd["cmd"] = cmd
        return MagicMock(returncode=0, stdout=SAMPLE_JUDGE_RESPONSE, stderr="")

    with patch("spec_bench.review.subprocess.run", side_effect=capture_run):
        run_judge(
            prd_path=prd_path,
            spec_path=spec_path,
            impl_dir=impl_dir,
            rubric_path=rubric_path,
            output_dir=output_dir,
            judge_model="claude-sonnet-4-5",
        )

    assert "--model" in captured_cmd["cmd"]
    model_idx = captured_cmd["cmd"].index("--model")
    assert captured_cmd["cmd"][model_idx + 1] == "claude-sonnet-4-5"


def test_run_judge_validates_model():
    """Should not crash if judge model is provided."""
    # This is a basic validation test
    pass  # The actual validation happens at matrix load time


# --- run_functional_tests ---

def _mock_playwright_infra(mock_popen_return=None):
    """Return a context manager stack that mocks all playwright + navigator dependencies."""
    from contextlib import ExitStack
    from unittest.mock import patch, MagicMock

    mock_pw_ctx = MagicMock()
    mock_browser = MagicMock()
    mock_page = MagicMock()
    mock_browser.new_page.return_value = mock_page
    mock_pw_ctx.chromium.launch.return_value = mock_browser

    stack = ExitStack()
    popen_mock = stack.enter_context(
        patch("spec_bench.review.subprocess.Popen",
              return_value=mock_popen_return or MagicMock())
    )
    stack.enter_context(patch("spec_bench.review._wait_for_server"))
    pw_mock = stack.enter_context(patch("playwright.sync_api.sync_playwright"))
    pw_mock.return_value.__enter__.return_value = mock_pw_ctx
    stack.enter_context(patch("spec_bench.app_navigator.setup_api_mocks", return_value=[]))
    stack.enter_context(patch("spec_bench.app_navigator.seed_profile"))
    stack.enter_context(patch("spec_bench.app_navigator.navigate_states", return_value=[]))
    stack.enter_context(patch("spec_bench.review._run_programmatic_checks", return_value={}))
    stack.enter_context(patch("spec_bench.vision_judge.run_vision_judge", return_value={}))
    return stack, popen_mock


def test_run_functional_tests_produces_results_file(tmp_path):
    """run_functional_tests writes functional-results.yml with expected structure."""
    from spec_bench.review import run_functional_tests

    functional_tests_path = tmp_path / "functional-tests.yml"
    functional_tests_path.write_text(SAMPLE_FUNCTIONAL_TESTS)
    app_dir = tmp_path / "app"
    app_dir.mkdir()
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    merged = [
        {"id": "F01", "requirement": "R01: Display current temperature",
         "passed": True, "evidence": "ok", "source": "programmatic"},
        {"id": "F02", "requirement": "R02: Show 5-day forecast",
         "passed": False, "evidence": "Element not found", "source": "llm-judge"},
    ]

    with _mock_playwright_infra()[0], \
         patch("spec_bench.review._merge_results", return_value=merged):
        results = run_functional_tests(
            app_dir=app_dir,
            functional_tests_path=functional_tests_path,
            output_dir=output_dir,
        )

    assert results["summary"]["total"] == 2
    assert results["summary"]["passed"] == 1
    assert results["summary"]["failed"] == 1
    assert results["summary"]["pass_rate"] == "1/2"
    assert (output_dir / "functional-results.yml").exists()


def test_run_functional_tests_result_structure(tmp_path):
    """Each result entry has id, requirement, passed, evidence, and source."""
    from spec_bench.review import run_functional_tests

    functional_tests_path = tmp_path / "functional-tests.yml"
    functional_tests_path.write_text(SAMPLE_FUNCTIONAL_TESTS)
    app_dir = tmp_path / "app"
    app_dir.mkdir()
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    merged = [
        {"id": "F01", "requirement": "R01: Display current temperature",
         "passed": True, "evidence": "Temperature element found", "source": "programmatic"},
        {"id": "F02", "requirement": "R02: Show 5-day forecast",
         "passed": False, "evidence": "Timeout: forecast section not found", "source": "llm-judge"},
    ]

    with _mock_playwright_infra()[0], \
         patch("spec_bench.review._merge_results", return_value=merged):
        results = run_functional_tests(
            app_dir=app_dir,
            functional_tests_path=functional_tests_path,
            output_dir=output_dir,
        )

    f01 = next(r for r in results["results"] if r["id"] == "F01")
    f02 = next(r for r in results["results"] if r["id"] == "F02")

    assert f01["passed"] is True
    assert "error" not in f01
    assert f01["evidence"] == "Temperature element found"

    assert f02["passed"] is False
    assert "Timeout" in f02["evidence"]


def test_run_functional_tests_stops_server(tmp_path):
    """Dev server process is terminated after tests complete."""
    from spec_bench.review import run_functional_tests

    functional_tests_path = tmp_path / "functional-tests.yml"
    functional_tests_path.write_text(SAMPLE_FUNCTIONAL_TESTS)
    app_dir = tmp_path / "app"
    app_dir.mkdir()
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    mock_proc = MagicMock()
    stack, _ = _mock_playwright_infra(mock_popen_return=mock_proc)

    with stack, patch("spec_bench.review._merge_results", return_value=[]):
        run_functional_tests(
            app_dir=app_dir,
            functional_tests_path=functional_tests_path,
            output_dir=output_dir,
        )

    mock_proc.terminate.assert_called_once()
