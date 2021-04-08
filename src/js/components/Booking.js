import {
  select,
  settings,
  templates,
  classNames
} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';


class Booking {
  constructor(element) {
    const thisBooking = this;

    // console.log('element', element);
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();

    thisBooking.selectedTable = [];
  }

  getData() {
    const thisBooking = this;

    const startDataParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDataParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDataParam,
        endDataParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDataParam,
        endDataParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        startDataParam,
      ],
    };
    // console.log('params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking +
        '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event +
        '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event +
        '?' + params.eventsRepeat.join('&'),
    };
    // console.log('url', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        //   console.log(bookings);
        //   console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    // console.log('thisBooking.booked', thisBooking.booked, eventsRepeat);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);



    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initTables(event) {
    const thisBooking = this;

    const choosenTable = event.target.getAttribute(settings.booking.tableIdAttribute);
    const floorSelected = event.target.classList.contains(classNames.booking.floorSelected);
    const tableSelected = event.target.classList.contains(classNames.booking.tableSelected);
    const tableBooked = event.target.classList.contains(classNames.booking.tableBooked);

    if (tableBooked) {
      alert('This table is not available!');

    } else if (!tableSelected && !floorSelected) {
      thisBooking.removeSelectedTable();
      
      event.target.classList.add('selected');
      thisBooking.selectedTable.push(choosenTable);

    } else if(tableSelected) {
      event.target.classList.remove('selected');
      thisBooking.selectedTable.pop(choosenTable);
    }
    console.log('thisBooking.selectedTable', thisBooking.selectedTable);
  }

  removeSelectedTable(){
    const thisBooking = this;

    const allSelected = thisBooking.dom.tablesWrapper.querySelectorAll(select.booking.selected);
    for(let selected of allSelected){
      selected.classList.remove('selected');
      const indexSelected = thisBooking.selectedTable.indexOf(selected);
      console.log('selected', selected);
      thisBooking.selectedTable.splice(indexSelected);
    }
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = element.querySelector(select.datePicker.wrapper);
    thisBooking.dom.hourPicker = element.querySelector(select.hourPicker.wrapper);
    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    thisBooking.dom.tablesWrapper = element.querySelector(select.booking.tablesWrapper);
    // console.log('tablesWrapper', thisBooking.dom.tablesWrapper);
    // console.log('thisBooking.dom.tables', thisBooking.dom.tables);

    // console.log('hourAmount', thisBooking.dom.hourPicker);
    // console.log('thisBooking.dom.datePicker', thisBooking.dom.datePicker);
    // console.log('thisBooking.dom.wrapper', thisBooking.dom.wrapper);
    // console.log('element', element);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.amountWidgetPeople = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.amountWidgetHours = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
      thisBooking.removeSelectedTable();

    });

    thisBooking.dom.tablesWrapper.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.initTables(event);
    });
  }
}
export default Booking;
