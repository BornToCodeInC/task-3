// --------------------------- Service Worker ---------------------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceWorker.js').then(function(reg) {

    if(reg.installing) {
      console.log('Service worker installing');
    } else if(reg.waiting) {
      console.log('Service worker installed');
    } else if(reg.active) {
      console.log('Service worker active');
    }

  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}
// --------------------------- Get DOM elements ---------------------------
const note = document.getElementById('notifications');
const eventList = document.getElementById('event-list');
const eventForm = document.getElementById('event-form');
const title = document.getElementById('title');
const hours = document.getElementById('event-hours');
const minutes = document.getElementById('event-minutes');
const day = document.getElementById('event-day');
const month = document.getElementById('event-month');
const year = document.getElementById('event-year');
const radios = document.getElementsByName('reminder');
const submit = document.getElementById('submit');
// --------------------------- Declare variables ---------------------------
const EVENT_LIST_URL = './eventList.json';
const getEvents = (url) => {
  fetch(url)
    .then((response) => {
      return response.json();
  }).then((eventArr) => {
      console.log(eventArr);
  }).catch(err => console.log(err))
};
const calculateDate = (date, n) => {
  var d = new Date();
  d.setTime(date.getTime() - n * 24 * 60 * 60 * 1000);
  return d;
};
const formatMonth = (month) => {
  switch(month) {
    case "January":
      return 0;
    case "February":
      return 1;
    case "March":
      return 2;
    case "April":
      return 3;
    case "May":
      return 4;
    case "June":
      return 5;
    case "July":
      return 6;
    case "August":
      return 7;
    case "September":
      return 8;
    case "October":
      return 9;
    case "November":
      return 10;
    case "December":
      return 11;
    default:
      alert('Incorrect month entered in database.'+month);
  }
};
let db;
const newItem = [
  { eventTitle: '', hours: 0, minutes: 0, day: 0, month: '', year: 0, notified: 'no' }
];

window.onload = function() {
  function notifyMe() {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
      alert("This browser does not support system notifications");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
      // If it's okay let's create a notification
      var notification = new Notification("Hi there!");
      // if (new Date().getDate() === 10){
      //   new Notification(new Date().getDate());
      // }
      if (new Date().getMinutes() === 31){
        new Notification(new Date().getMinutes());
      }
      var interval = window.setInterval(function () {
        // Thanks to the tag, we should only see the "Hi! 9" notification

        if (new Date().getMinutes() === 37) {
          window.clearInterval(interval);
          new Notification("Hi! ", {tag: 'soManyNotification'})
        }
      }, 200);
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          var notification = new Notification("Hi there!");
        }
      });
    }

    // Finally, if the user has denied notifications and you
    // want to be respectful there is no need to bother them any more.
  }
  // Notification.requestPermission().then(function(result) {
  //   console.log(result);
  //   // notifyMe();
  // });
    getEvents(EVENT_LIST_URL);

  note.innerHTML += '<li>App initialised.</li>';
  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  const DBOpenRequest = window.indexedDB.open("eventList", 4);
  DBOpenRequest.onerror = (event) => {
    note.innerHTML += '<li>Error loading database.</li>';
  };

  DBOpenRequest.onsuccess = (event) => {
    note.innerHTML += '<li>Database initialised.</li>';
    db = DBOpenRequest.result;
    // Run the displayData() function to populate the  list with all the to-do list data already in the IDB
    displayData();
  };
  DBOpenRequest.onupgradeneeded = (event) => {
    const db = event.target.result;

    db.onerror = (event) => {
      note.innerHTML += '<li>Error loading database.</li>';
    };

    const objectStore = db.createObjectStore("eventList", { keyPath: "eventTitle" });
    // define what data items the objectStore will contain
    objectStore.createIndex("hours", "hours", { unique: false });
    objectStore.createIndex("minutes", "minutes", { unique: false });
    objectStore.createIndex("day", "day", { unique: false });
    objectStore.createIndex("month", "month", { unique: false });
    objectStore.createIndex("year", "year", { unique: false });
    objectStore.createIndex("notified", "notified", { unique: false });

    note.innerHTML += '<li>Object store created.</li>';
  };
  const addData = (e) => {
    e.preventDefault();
    let reminder;
    for (let i = 0, length = radios.length; i < length; i++)
    {
      if (radios[i].checked)
      {
        reminder = radios[i];
        break;
      }
    }
    if(title.value === '' || hours.value === null || minutes.value === null || day.value === '' || month.value === '' || year.value === null) {
      note.innerHTML += '<li>Data not submitted — form incomplete.</li>';
      return;
    } else {
      const newItem = [
        { eventTitle: title.value, hours: hours.value, minutes: minutes.value, day: day.value, month: month.value, year: year.value,
          reminder: reminder.value, notified: 'no' }
      ];
      const transaction = db.transaction(["eventList"], 'readwrite');
      transaction.oncomplete = () => {
        note.innerHTML += '<li>Transaction completed: database modification finished.</li>';

        // update the display of data to show the newly added item, by running displayData() again.
        displayData();
      };

      transaction.onerror = () => {
        note.innerHTML += '<li>Transaction not opened due to error: ' + transaction.error + '</li>';
      };

      // call an object store that's already been added to the database
      const objectStore = transaction.objectStore("eventList");
      console.log(objectStore.indexNames);
      console.log(objectStore.keyPath);
      console.log(objectStore.name);
      console.log(objectStore.transaction);
      console.log(objectStore.autoIncrement);

      // Make a request to add our newItem object to the object store
      const objectStoreRequest = objectStore.add(newItem[0]);
      objectStoreRequest.onsuccess = (event) => {
        note.innerHTML += '<li>Request successful.</li>';
        // clear the form, ready for adding the next entry
        title.value = '';
        hours.value = null;
        minutes.value = null;
        day.value = 10;
        month.value = 'February';
        year.value = 2019;
      };
    };
  };
  const deleteItem = (e) => {
    // retrieve the name of the task we want to delete
    const dataEvent = e.target.getAttribute('data-event');

    // open a database transaction and delete the task, finding it by the name we retrieved above
    const transaction = db.transaction(['eventList'], 'readwrite');
    const request = transaction.objectStore('eventList').delete(dataEvent);

    // report that the data item has been deleted
    transaction.oncomplete = () => {
      // delete the parent of the button, which is the list item, so it no longer is displayed
      e.target.parentNode.parentNode.removeChild(e.target.parentNode);
      note.innerHTML += '<li>Task \"' + dataEvent + '\" deleted.</li>';
    };
  };
  function displayData() {
    eventList.innerHTML = "";
    // Open our object store and then get a cursor list of all the different data items in the IDB to iterate through
    const objectStore = db.transaction('eventList').objectStore('eventList');
    objectStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      // if there is still another cursor to go, keep runing this code
      if(cursor) {
        // create a list item to put each data item inside when displaying it
        const listItem = document.createElement('li');
        // check which suffix the deadline day of the month needs
        if(cursor.value.day === 1 || cursor.value.day === 21 || cursor.value.day === 31) {
          daySuffix = "st";
        } else if(cursor.value.day === 2 || cursor.value.day === 22) {
          daySuffix = "nd";
        } else if(cursor.value.day === 3 || cursor.value.day === 23) {
          daySuffix = "rd";
        } else {
          daySuffix = "th";
        }

        // build the list entry and put it into the list item via innerHTML.
        listItem.innerHTML = `${cursor.value.eventTitle} — ${cursor.value.hours} : ${cursor.value.minutes} ,
         ${cursor.value.month} ${cursor.value.day}${daySuffix} ${cursor.value.year}.`;
        const now = new Date();
        const minuteCheck = now.getMinutes();
        const hourCheck = now.getHours();
        const dayCheck = now.getDate();
        const monthCheck = now.getMonth();
        const yearCheck = now.getFullYear();
        const monthNumber = formatMonth(cursor.value.month);
        if (+(cursor.value.year) < yearCheck && monthNumber < monthCheck && +(cursor.value.day) < dayCheck &&
          +(cursor.value.hours) < hourCheck && +(cursor.value.minutes) < minuteCheck) {
          if(cursor.value.notified === 'yes') {
            listItem.style.textDecoration = 'line-through';
            listItem.style.color = 'rgba(255,0,0,0.5)';
          } else {
            listItem.style.color = 'rgb(63, 66, 68)';
          }
        }

        // put the item item inside the list
        eventList.appendChild(listItem);

        // create a delete button inside each list item, giving it an event handler so that it runs the deleteButton()
        // function when clicked
        const deleteButton = document.createElement('button');
        listItem.appendChild(deleteButton);
        deleteButton.innerHTML = 'X';
        // here we are setting a data attribute on our delete button to say what task we want deleted if it is clicked!
        deleteButton.setAttribute('data-event', cursor.value.eventTitle);
        deleteButton.onclick = (event) => {
          deleteItem(event);
        }
        // continue on to the next item in the cursor
        cursor.continue();
        // if there are no more cursor items to iterate through, say so, and exit the function
      } else {
        note.innerHTML += '<li>Entries all displayed.</li>';
      }
    }
  }
  function createNotification(title, reminder = '') {
    if (!"Notification" in window) {
      console.log("This browser does not support notifications.");
    } else if (Notification.permission === "granted") {
      const img = '/assets/img/cartoon.png';
      const text = `HEY! ${title} `;
      const notification = new Notification(`${reminder ? `${reminder} days remaining` : 'Riminder'}`, { body: text, icon: img });
      window.navigator.vibrate(500);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        if(!('permission' in Notification)) {
          Notification.permission = permission;
        }
        if (permission === "granted") {
          const img = '/assets/img/heart.png';
          const text = `HEY! ${title}`;
          const notification = new Notification(`${reminder ? `${reminder} days remaining` : 'Riminder'}`, { body: text, icon: img });
          window.navigator.vibrate(500);
        }
      });
    }

    const objectStore = db.transaction(['eventList'], "readwrite").objectStore('eventList');
    const objectStoreTitleRequest = objectStore.get(title);
    objectStoreTitleRequest.onsuccess = () => {
      const data = objectStoreTitleRequest.result;
      data.notified = 'yes';
      const updateTitleRequest = objectStore.put(data);
      updateTitleRequest.onsuccess = () => {
        displayData();
      }
    }
  };
  function checkDate() {
    const now = new Date();
    const minuteCheck = now.getMinutes();
    const hourCheck = now.getHours();
    const dayCheck = now.getDate();
    const monthCheck = now.getMonth();
    const yearCheck = now.getFullYear();
    const objectStore = db.transaction(['eventList'], 'readwrite').objectStore('eventList');
    objectStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if(cursor) {
        const monthNumber = formatMonth(cursor.value.month);
        if(+(cursor.value.hours) == hourCheck && +(cursor.value.minutes) == minuteCheck && +(cursor.value.day) == dayCheck && monthNumber == monthCheck && cursor.value.year == yearCheck && cursor.value.notified == "no") {
          // If the numbers all do match, run the createNotification() function to create a system notification
          createNotification(cursor.value.eventTitle);
        }
        const event = new Date(+(cursor.value.year), monthNumber, +(cursor.value.day));
        const reminderDate = calculateDate(event, +(cursor.value.reminder));
        if (+(reminderDate.getDate()) == dayCheck && reminderDate.getMonth() == monthCheck && +(reminderDate.getFullYear()) == yearCheck && cursor.value.notified == "no") {
          createNotification(cursor.value.eventTitle, cursor.value.reminder);
        }
        // move on and perform the same deadline check on the next cursor item
        cursor.continue();
      }
    }
  };
  eventForm.addEventListener('submit',addData, false);
  setInterval(checkDate, 200);
};