// ==UserScript==
// @name         Golfing
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  book golf tee times
// @author       You
// @match        https://foreupsoftware.com/index.php/booking/*
// @grant        none
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js 
// ==/UserScript==


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitFor(fn, msg) {
    let max = 100;
    while (!fn()) {
        await timeout(10);
        max --;
        if (max === 0) {
            alert("Never finished waiting!" + msg)
        }
    }
    if (!fn()) {
        alert("Something went wrong after waiting!" + msg)
    }
}

let testing = false;

async function main() {

  	 $('.booking-classes button:contains(Resident Adult):not(:contains(Advance))')[0].click()
    await waitFor(() => $('.players a').length === 4, " 4 players")
    $('.players a')[3].click()

    let months = []
    let monthdivs = $('.datepicker-months .month');
    for (let i = 0; i < monthdivs.length; i++) {
        let monthdiv = monthdivs[i];
        if ($(monthdiv).hasClass('disabled')) {
            continue;
        }
        months.push(monthdiv)
    }
    console.log("Found months", months.map((x) => $(x).text()).join("\n"))
    if (!months.length) {
        alert("No months available?")
    }
    $(months[months.length-1]).click()

    let days = []
    let daydivs = $('.datepicker-days .day');
    for (let i = 0; i < daydivs.length; i++) {
        let daydiv = daydivs[i];
        if ($(daydiv).hasClass('disabled')) {
            continue;
        }
        days.push(daydiv)
    }
    if (!days.length) {
        alert("No days available?")
    }

    $(days[days.length-1]).click()
    console.log('wait for click')
    await timeout(1000); // TODO make better, wait for loading?
    console.log('waited for click')
    function noTimesAvailable() {
        return $($("h1", $('#times .time')[0])[0]).text() === "No tee times available";
    }
    function hasTimesAvailable() {
        return $('.start', $('#times .time')[0]).length > 0;
    }

    await waitFor(() => {return hasTimesAvailable() || noTimesAvailable()}, " wait for times to load")
		console.log("times avilable?", hasTimesAvailable(), "no times available?", noTimesAvailable())
    if (noTimesAvailable()) {
        console.log('retry')
        window.location.reload()
        return;
    }
    console.log("num start times", $('.start', $('#times .time')[0]).length)

    let found_time_slot = null;
    let time_slot_items = $('#times .time');
    for (let i = 0; i < time_slot_items.length; i++) {
        let time_slot_item = time_slot_items[i]
        let text = $('.start', time_slot_item).text()
        // before 7 am
        let suffix = text.slice(text.length - 2);
        if (!testing && suffix === 'pm') {continue}
        if (suffix !== 'pm' && suffix !== 'am') {
            alert('error ask jeff, neither am or pm: ' + text)
        }
        text = text.slice(0, text.length - 2);
        let parts = text.split(':')
        let minutes_since_midnight = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        if (minutes_since_midnight <= 7 * 60) {
            found_time_slot = time_slot_item;
        }
        console.log(text)
    }
    if (found_time_slot === null) {
        alert("Hmm failed today?")
        return;
        window.location.reload()
    }
    found_time_slot.click()
    await waitFor(() => $('#book_time .modal-footer button').length === 2, " modal")
    let btn = $('#book_time .modal-footer button')[0]
    if (btn.innerText !== "Book Time") {
        alert("Expected book time button")
    }
    if (!testing) {
        btn.click()
    }
}

(function() {
    'use strict';
    main()
})();
