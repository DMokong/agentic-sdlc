import pytest
from pathlib import Path
from spec_bench.config import load_matrix, load_prd, MatrixConfig, PRDConfig

FIXTURES = Path(__file__).parent / "fixtures"


def test_load_matrix_valid(tmp_path):
    matrix_file = tmp_path / "matrix.yml"
    matrix_file.write_text("""
benchmark:
  prd: weather-transport
  runs_per_combination: 1
  constant_implementer:
    harness: claude-code
    model: sonnet-4-6
    process: superpowers
    permissions: dangerously-skip-permissions
  judge:
    model: opus-4-6
  targets:
    - id: cc-vanilla-opus
      harness: claude-code
      model: opus-4-6
      process: vanilla
""")
    config = load_matrix(matrix_file)
    assert config.prd == "weather-transport"
    assert config.runs_per_combination == 1
    assert config.judge_model == "opus-4-6"
    assert len(config.targets) == 1
    assert config.targets[0].id == "cc-vanilla-opus"
    assert config.targets[0].process == "vanilla"


def test_load_matrix_rejects_unknown_process(tmp_path):
    matrix_file = tmp_path / "matrix.yml"
    matrix_file.write_text("""
benchmark:
  prd: test
  runs_per_combination: 1
  constant_implementer:
    harness: claude-code
    model: sonnet-4-6
    process: superpowers
    permissions: dangerously-skip-permissions
  judge:
    model: opus-4-6
  targets:
    - id: test-target
      harness: claude-code
      model: opus-4-6
      process: unknown-process
""")
    with pytest.raises(ValueError, match="unknown-process"):
        load_matrix(matrix_file)


def test_load_matrix_rejects_judge_same_as_implementer(tmp_path):
    matrix_file = tmp_path / "matrix.yml"
    matrix_file.write_text("""
benchmark:
  prd: test
  runs_per_combination: 1
  constant_implementer:
    harness: claude-code
    model: sonnet-4-6
    process: superpowers
    permissions: dangerously-skip-permissions
  judge:
    model: sonnet-4-6
  targets:
    - id: test-target
      harness: claude-code
      model: opus-4-6
      process: vanilla
""")
    with pytest.raises(ValueError, match="judge.model must differ"):
        load_matrix(matrix_file)
