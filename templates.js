const createLocationQuery = (zipcodes) => {
    return `I prefer events near these zipcodes: ${zipcodes.join(', ')}.`
}

const createDayQuery = (daysOfWeek) => {
    return `I prefer events on these days: ${daysOfWeek.join(', ')}.`
}

const createActivityQuery = (activities) => {
    return `I like going to these types of events: ${activities.join(', ')}.`
}

const createOrganizationQuery = (organizations) => {
    return `I like attending events hosted by these organizations: ${organizations.join(', ')}.`
}

const createVenueQuery = (venues) => {
    return `I like attending events at these venues: ${venues.join(', ')}.`
}

const createDataArrays = (body) => {
const zipcodes = []
const daysOfWeek = []
const activities = []
const organizations = []
const venues = []

let events = body?.pastEvents

events.forEach(event => {
    if (event.zipcode){
        zipcodes.push(event.zipcode)
    }
    if (event.dayOfWeek){
        daysOfWeek.push(event.dayOfWeek)
    }
    if (event.activity){
        activities.push(event.activity)
    }
    if (event.orgName){
        organizations.push(event.orgName)
    }
    if (event.venueName){
        venues.push(event.venueName)
    }
})
return {zipcodesQuery: createLocationQuery(zipcodes), daysOfWeekQuery: createDayQuery(daysOfWeek), activitiesQuery: createActivityQuery(activities), organizationsQuery: createOrganizationQuery(organizations), venuesQuery: createVenueQuery(venues), textQuery: body?.textQuery && body.textQuery.length > 0 ? body.textQuery : null}
}

function parseEvent(text, score) {
    const lines = text.split('\n');
    const eventDetails = {};
  
    lines.forEach(line => {
      if (line.startsWith("Event Date:")) {
        eventDetails["eventDate"] = line.split(": ")[1];
      } else if (line.startsWith("Day:")) {
        eventDetails["dayOfWeek"] = line.split(": ")[1];
      } else if (line.startsWith("Organization:")) {
        eventDetails["orgName"] = line.split(": ")[1];
      } else if (line.startsWith("Event Activity:")) {
        eventDetails["activity"] = line.split(": ")[1];
      } else if (line.startsWith("Event Name:")) {
        eventDetails["eventName"] = line.split(": ")[1];
      } else if (line.startsWith("Venue Name:")) {
        eventDetails["venueName"] = line.split(": ")[1];
      } else if (line.startsWith("Venue Zipcode:")) {
        eventDetails["zipcode"] = line.split(": ")[1];
      } else if (line.startsWith("seatsLeftToPurchase:")) {
        eventDetails["seatsLeftToPurchase"] = parseFloat(line.split(": ")[1]);
      }
    });
  
    eventDetails["similarityScore"] = score;
    return eventDetails;
  }

module.exports = {
    createDataArrays,
    parseEvent
}