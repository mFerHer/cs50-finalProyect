from datetime  import datetime
import requests
import sqlite3


db = sqlite3.connect("data.db")
curs = db.cursor()                 

curs.execute("""CREATE TABLE IF NOT EXISTS info (
             id INTEGER PRIMARY KEY NOT NULL,
             name TEXT NOT NULL,
             address TEXT NOT NULL,
             locality TEXT,
             municipality TEXT,
             timetable TEXT,
             latitude REAL NOT NULL,
             longitude REAL NOT NULL
             )
""")

curs.execute("""CREATE TABLE IF NOT EXISTS prices (
             id INTEGER PRIMARY KEY NOT NULL,
             gasoline95 REAL,
             gasoline98 REAL,
             diesel REAL,
             diesel_premium REAL,
             dieselB REAL,
             FOREIGN KEY (id) REFERENCES info(id)
             )
""")

curs.execute("""CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
    )
""")


url = "https://energia.serviciosmin.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/"   

response = requests.get(url)
data = response.json()
stations = data["ListaEESSPrecio"]

def convert_price(price):
    if price is None or price == "":
        return None
    return float(price.replace(",", "."))

for station in stations:
    if station["Tipo Venta"] != "P":
        continue

    id = int(station["IDEESS"])        
    name = station["Rótulo"]
    address = f"{station['Dirección']}, {station['C.P.']}"
    locality = station["Localidad"]
    municipality = station["Provincia"]
    timetable = station["Horario"]
    latitude = float(station["Latitud"].replace(",", "."))
    longitude = float(station["Longitud (WGS84)"].replace(",", "."))
    curs.execute("""INSERT INTO info (id, name, address, locality, municipality, timetable, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        address = excluded.address,
        locality = excluded.locality,
        municipality = excluded.municipality,
        timetable = excluded.timetable,
        latitude = excluded.latitude,
        longitude = excluded.longitude
    """, (id, name, address, locality, municipality, timetable, latitude, longitude))
    
    gasoline95 = convert_price(station["Precio Gasolina 95 E5"])
    gasoline98 = convert_price(station["Precio Gasolina 98 E5"])
    diesel = convert_price(station["Precio Gasoleo A"])
    diesel_premium = convert_price(station["Precio Gasoleo Premium"])
    dieselB = convert_price(station["Precio Gasoleo B"])
    curs.execute("""INSERT INTO prices (id, gasoline95, gasoline98, diesel, diesel_premium, dieselB)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        gasoline95 = excluded.gasoline95,
        gasoline98 = excluded.gasoline98,
        diesel = excluded.diesel,
        diesel_premium = excluded.diesel_premium,
        dieselB = excluded.dieselB
    """, (id, gasoline95, gasoline98, diesel, diesel_premium, dieselB))

    curs.execute("""INSERT INTO metadata (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET
        value = excluded.value
    """, ("last_update", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")))
    

db.commit()
db.close()
