"""Matrix and PRD configuration loading and validation."""

import re
from dataclasses import dataclass, field
from pathlib import Path
import yaml

VALID_PROCESSES = {"vanilla", "superpowers"}


@dataclass
class Target:
    id: str
    harness: str
    model: str
    process: str


@dataclass
class ConstantImplementer:
    harness: str
    model: str
    process: str
    permissions: str


@dataclass
class MatrixConfig:
    prd: str
    runs_per_combination: int
    constant_implementer: ConstantImplementer
    judge_model: str
    targets: list[Target]


@dataclass
class PRDConfig:
    id: str
    name: str
    version: str
    difficulty: str
    estimated_features: int
    estimated_impl_time: str
    content: str        # Stripped of HTML comments — for spec generators
    raw_content: str    # Full content including implied requirements — for the judge
    prd_dir: Path


def _strip_html_comments(text: str) -> str:
    """Remove HTML comment blocks from text."""
    return re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)


def load_matrix(path: Path) -> MatrixConfig:
    """Load and validate a benchmark matrix configuration."""
    with open(path) as f:
        raw = yaml.safe_load(f)

    bench = raw["benchmark"]
    ci = bench["constant_implementer"]
    judge_model = bench["judge"]["model"]

    if judge_model == ci["model"]:
        raise ValueError(
            f"judge.model must differ from constant_implementer.model "
            f"(both are '{judge_model}')"
        )

    targets = []
    for t in bench["targets"]:
        if t["process"] not in VALID_PROCESSES:
            raise ValueError(
                f"Invalid process '{t['process']}' for target '{t['id']}'. "
                f"Valid values: {VALID_PROCESSES}"
            )
        targets.append(Target(
            id=t["id"],
            harness=t["harness"],
            model=t["model"],
            process=t["process"],
        ))

    return MatrixConfig(
        prd=bench["prd"],
        runs_per_combination=bench.get("runs_per_combination", 1),
        constant_implementer=ConstantImplementer(
            harness=ci["harness"],
            model=ci["model"],
            process=ci["process"],
            permissions=ci["permissions"],
        ),
        judge_model=judge_model,
        targets=targets,
    )


def load_prd(prd_name: str, prds_dir: Path) -> PRDConfig:
    """Load a PRD from the library by name."""
    prd_dir = prds_dir / prd_name
    prd_file = prd_dir / "prd.md"

    if not prd_file.exists():
        raise FileNotFoundError(f"PRD not found: {prd_file}")

    raw_content = prd_file.read_text()

    # Parse YAML frontmatter
    if raw_content.startswith("---"):
        _, fm, body = raw_content.split("---", 2)
        meta = yaml.safe_load(fm)
    else:
        meta = {}
        body = raw_content

    # Strip HTML comments from content exposed to spec generators
    # so implied requirements (IR01-IR08) are not leaked
    content = _strip_html_comments(raw_content)

    return PRDConfig(
        id=meta.get("id", prd_name),
        name=meta.get("name", prd_name),
        version=str(meta.get("version", "1.0")),
        difficulty=meta.get("difficulty", "medium"),
        estimated_features=meta.get("estimated_features", 0),
        estimated_impl_time=meta.get("estimated_impl_time", "unknown"),
        content=content,
        raw_content=raw_content,
        prd_dir=prd_dir,
    )
