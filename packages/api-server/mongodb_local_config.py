from os.path import dirname

from api_server.default_config import config

here = dirname(__file__)
run_dir = f"{here}/run"

# Update configuration for MongoDB
config.update(
    {
        "db_url": "mongodb://admin:admin@localhost:27017/rmf",  # Update username, password, and port as necessary
        "cache_directory": f"{run_dir}/cache",  # The directory where cached files should be stored.
    }
)
