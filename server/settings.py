from pydantic import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    sqlalchemy_database_uri: str = 'sqlite:///labflow.db'
    sqlalchemy_echo: bool = False
    auth_provider: str = 'auth0'
    auth0_domain: str
    auth0_client_id: str
    auth0_authorization_url: str
    auth0_token_url: str
    casbin_model: str = 'casbinmodel.conf'
    # Defaults to the sqlalchemy_database_uri value.
    casbin_sqlalchemy_database_uri: Optional[str] = None
    server_version: str = 'local'

    @property
    def casbin_database_uri(self):
        if self.casbin_sqlalchemy_database_uri is not None:
            return self.casbin_sqlalchemy_database_uri
        return self.sqlalchemy_database_uri

settings = Settings()
