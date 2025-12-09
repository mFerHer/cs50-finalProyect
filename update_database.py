from datetime import datetime
import requests
import sqlite3


db = sqlite3.connect('data.db')
curs = db.cursor()                 

curs.execute("""CREATE TABLE IF NOT EXISTS info (
             id INTEGER PRIMARY KEY NOT NULL,
             name TEXT NOT NULL,
             address TEXT NOT NULL,
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


url = "https://energia.serviciosmin.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/"   

response = requests.get(url)
data = response.json()
stations = data['ListaEESSPrecio']

def convert_price(price):
    if price is None or price == "":
        return None
    return float(price.replace(",", "."))

for station in stations:
    if station['Tipo Venta'] != 'P':
        continue

    id = int(station["IDEESS"])        
    name = station['Rótulo']
    address = f"{station['Dirección']}, {station['C.P.']}, {station['Localidad']}, {station['Provincia']}"
    timetable = station['Horario']
    latitude = float(station['Latitud'].replace(",", "."))
    longitude = float(station['Longitud (WGS84)'].replace(",", "."))

    curs.execute("""INSERT INTO info (id, name, address, timetable, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        address = excluded.address,
        timetable = excluded.timetable,
        latitude = excluded.latitude,
        longitude = excluded.longitude
    """, (id, name, address, timetable, latitude, longitude))
    
    gasoline95 = convert_price(station['Precio Gasolina 95 E5'])
    gasoline98 = convert_price(station['Precio Gasolina 98 E5'])
    diesel = convert_price(station['Precio Gasoleo A'])
    diesel_premium = convert_price(station['Precio Gasoleo Premium'])
    dieselB = convert_price(station['Precio Gasoleo B'])

    curs.execute("""INSERT INTO prices (id, gasoline95, gasoline98, diesel, diesel_premium, dieselB)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        gasoline95 = excluded.gasoline95,
        gasoline98 = excluded.gasoline98,
        diesel = excluded.diesel,
        diesel_premium = excluded.diesel_premium,
        dieselB = excluded.dieselB
    """, (id, gasoline95, gasoline98, diesel, diesel_premium, dieselB))
    
db.commit()
db.close()

with open("last_update.txt", "w") as f:
    f.write(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))