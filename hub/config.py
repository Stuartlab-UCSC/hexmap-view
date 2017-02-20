
class Config(object):
    DEBUG = False
    TESTING = False

class ProductionKolossusConfig(Config):
    pass

class DevelopmentSwatConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
