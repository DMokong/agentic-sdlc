"""Spec-Bench CLI entrypoint."""

import click
from pathlib import Path

BENCHMARKS_DIR = Path(__file__).parent.parent.parent


@click.group()
@click.pass_context
def main(ctx):
    """Spec-Bench: Speculator benchmark harness."""
    ctx.ensure_object(dict)
    ctx.obj["benchmarks_dir"] = BENCHMARKS_DIR


@main.command()
@click.option("--prd", required=True, help="PRD name from the library")
@click.option("--matrix", default="default.yml", help="Matrix config file")
@click.option("--runs", default=1, type=int, help="Runs per combination")
@click.pass_context
def run(ctx, prd, matrix, runs):
    """Run the full benchmark."""
    click.echo(f"Running benchmark: prd={prd}, matrix={matrix}, runs={runs}")
    # Implemented in Task 8


@main.command()
@click.option("--run", "run_id", required=True, help="Run ID to generate report for")
@click.pass_context
def report(ctx, run_id):
    """Generate report from existing run data."""
    click.echo(f"Generating report for: {run_id}")
    # Implemented in Task 8


@main.command()
@click.option("--run", "run_id", required=True, help="Run ID to calibrate")
@click.pass_context
def calibrate(ctx, run_id):
    """Run calibration (human-in-the-loop)."""
    click.echo(f"Calibrating: {run_id}")
    # Implemented in Task 8


@main.command()
@click.pass_context
def prds(ctx):
    """List available PRDs."""
    prds_dir = ctx.obj["benchmarks_dir"] / "prds"
    if not prds_dir.exists():
        click.echo("No PRDs directory found.")
        return
    for prd_dir in sorted(prds_dir.iterdir()):
        if prd_dir.is_dir() and (prd_dir / "prd.md").exists():
            click.echo(f"  {prd_dir.name}")


@main.command("add-prd")
@click.option("--path", required=True, type=click.Path(exists=True), help="Path to PRD file")
@click.pass_context
def add_prd(ctx, path):
    """Add a new PRD to the library."""
    import shutil
    src = Path(path)
    dest = ctx.obj["benchmarks_dir"] / "prds" / src.stem
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copy(src, dest / "prd.md")
    click.echo(f"Added PRD: {src.stem}")
