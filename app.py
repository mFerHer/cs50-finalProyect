from datetime import datetime
import requests     # Import the requests library to handle HTTP requests
import sqlite3    # Import the sqlite3 library to interact with SQLite databases


# Connect to the SQLite database
db = sqlite3.connect('data.db')
# Create a cursor object to execute SQL commands
curs = db.cursor()                 

curs.execute("DROP TABLE IF EXISTS info")

    
# Save changes & close the database
db.commit()
db.close()

# test print first station
# print(stations[0])


# print in the front page date and time of the last update