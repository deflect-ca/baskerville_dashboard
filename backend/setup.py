from setuptools import setup

# To use a consistent encoding
from codecs import open
from os import path

here = path.abspath(path.dirname(__file__))

# README as the long description
with open(path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

REQUIREMENTS = [i.strip() for i in open('requirements.txt').readlines()]
tests_require = [
    'pytest'
    'mock'
]

setup(name='baskerville_dash',
      version='0.0.1',
      description='',
      long_description=long_description,
      tests_require=tests_require,
      extras_require={
          'test': tests_require
      },
      test_suite='pytest.collector',
      install_requires=REQUIREMENTS,
      package_dir={'': 'src'},
      packages=[
          'baskerville_dash',
          'baskerville_dash.db',
          'baskerville_dash.routes',
          'baskerville_dash.utils',
          'baskerville_dash.vm',
      ],
      )
