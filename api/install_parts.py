"""Pre-install custom clothing SVGs into python_avatars at build time."""
import pathlib
import python_avatars as pa

base = pathlib.Path(__file__).parent

for name in ("docker_shirt", "tilt_shirt"):
    svg_path = base / f"{name}.svg"
    try:
        getattr(pa.ClothingType, name.upper())
        print(f"  ✓ {name} already installed")
    except AttributeError:
        pa.install_part(str(svg_path), pa.ClothingType)
        print(f"  ✓ {name} installed")
