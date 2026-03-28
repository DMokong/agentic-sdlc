from spec_bench.vision_judge import parse_verdicts


def test_parse_verdicts_from_yaml():
    raw = """
F01:
  passed: true
  evidence: "Temperature shown as 18.5°C with feels like and wind"
F02:
  passed: false
  evidence: "Only 3 day labels visible, expected 5"
"""
    verdicts = parse_verdicts(raw)
    assert verdicts["F01"]["passed"] is True
    assert verdicts["F02"]["passed"] is False
    assert "18.5°C" in verdicts["F01"]["evidence"]


def test_parse_verdicts_with_markdown_fences():
    raw = """```yaml
F01:
  passed: true
  evidence: "Works"
```"""
    verdicts = parse_verdicts(raw)
    assert verdicts["F01"]["passed"] is True


def test_parse_verdicts_empty():
    assert parse_verdicts("not yaml at all {}[]") == {} or parse_verdicts("") == {}
