import json
from scheme import Scheme

filename = "/Users/mattlavis/sites and projects/1. Online Tariff/ott prototype/app/data/roo/uk/roo_schemes_uk.json"

f = open(filename)
data = json.load(f)
schemes = data["schemes"]
for scheme in schemes:
    s = Scheme(scheme)
    ret = s.validate()
    if ret is not None:
        print(ret)
