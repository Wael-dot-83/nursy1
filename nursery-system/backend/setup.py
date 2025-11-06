"""
Minimal setup.py for installing the app package in development mode.
This allows pytest to properly import the app module.
"""
from setuptools import setup, find_packages

setup(
    name="nursery-app",
    version="1.0.0",
    packages=find_packages(exclude=["tests", "tests.*"]),
    python_requires=">=3.11",
    install_requires=[
        # All requirements are in requirements.txt
        # This is just for package structure
    ],
)
