<<<<<<< HEAD
# Location Alarm Tracker

This is a Java web project I built for travelers. The idea is simple — instead of worrying about missing your stop, the app tracks your location and alerts you before you reach your destination.

## What it does

* lets users sign up and log in
* you can search a place or just pick it on the map
* set an alarm based on distance or estimated time
* tracks your live location in the browser
* saves trips in Oracle database
* shows your recent trips

## Tech used

* Java 17
* Spring Boot
* JDBC (Oracle)
* Thymeleaf
* Leaflet + OpenStreetMap

## Project Structure

```
src/main/java/com/locationalarm/
│
├── controller/      # Handles web requests & APIs
├── service/         # Business logic
├── repository/      # JDBC database operations
│
src/main/resources/
│
├── templates/       # Thymeleaf HTML pages
├── static/          # CSS & JS files
├── schema.sql       # Oracle DB schema
```

---

## Database setup

1. Create a schema in Oracle
2. Run the `schema.sql` file
3. Update `application.properties` with your DB details

Example:

```
app.db.url=jdbc:oracle:thin:@localhost:1521/XEPDB1
app.db.username=system
app.db.password=oracle
```

## Run the project

```
mvn spring-boot:run
```

Then open:

```
http://localhost:8080
```

## Notes

* needs location permission in browser
* alarm works based on your live movement
* starting a new trip will close the previous one

---
=======
# Full-Stack-Project-2
>>>>>>> 0711d6311363dadf92e2d6d7a842d820e2623d3b
