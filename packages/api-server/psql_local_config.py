from os.path import dirname

from api_server.default_config import config

here = dirname(__file__)
run_dir = f"{here}/run"

# Do not forget to change the username and password depending on your postgresql configuration
# The default username and password is ugurgen
# The default port is 5432
# The default database name is rmf
# The default host is 127.0.0.1
# If you want to change the default configuration, you can change it in the following line

config.update(
    {
        "db_url": "postgres://admin:admin@127.0.0.1:5432/dockerdb",  # change ugurgen depending on your username and password after port/{db_name}
        "cache_directory": f"{run_dir}/cache",  # The directory where cached files should be stored.
    }
)
