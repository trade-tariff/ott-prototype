import xml.etree.ElementTree as ET


filename = "/Users/mattlavis/sites and projects/1. Online Tariff/tariff data/CDS/export-20220125T000000_20220125T235959-20220126T001534.xml"
tree = ET.parse(filename)
root = tree.getroot()
xpath = "/bookstore/book[price>35]/price"
xpath = ".//certificate[certificateCode='018']/../.."
matches = root.findall(xpath)
for match in matches:
    measure_sid = match.find("sid").text
    commodity_code = match.find("goodsNomenclature/goodsNomenclatureItemId").text
    print("Measure SID:{sid}, comm code: {comm_code}".format(sid = measure_sid, comm_code = commodity_code))
    a = 1
a = 1