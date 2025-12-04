import requests     # Import the requests library to handle HTTP requests
import sqlite3    # Import the sqlite3 library to interact with SQLite databases

# Define the URL for the API endpoint
url = "https://energia.serviciosmin.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/"   

response = requests.get(url)           # Send a GET request to the specified URL
data = response.json()                 # Parse the JSON response into a Python dictionary
stations = data['ListaEESSPrecio']     # Extract the list of fuel stations from the response

db = sqlite3.connect('stations.db')  # Connect to the SQLite database
curs = db.cursor()                 # Create a cursor object to execute SQL commands

# Create the stations table in the db if it doesn't exist
curs.execute("""CREATE TABLE IF NOT EXISTS stations (
             id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
             name TEXT,
             address TEXT,
             latitude REAL,
             longitude REAL,
             price_gasoline95 REAL,
             price_gasoline98 REAL,
             price_diesel REAL,
             price_diesel_premium REAL,
             price_dieselB REAL,
             latest_update TEXT,
             timetable TEXT,
             service_type TEXT 
            )
""")

# Date and Time of the last update of the price in the station
# TODO define service types: A P D
db.commit()
db.close()


# only take public stations
while stations.tipoVenta == 'P':
    for station in stations:               
        name = station['Rótulo']
        address = station['Dirección']


# TODO insert data into the database