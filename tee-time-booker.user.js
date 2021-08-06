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

async function waitFor(fn, msg, max_seconds) {
    if (!max_seconds) { max_seconds = 5 }
    let max_t = Date.now() + max_seconds * 1000;
    while (!fn()) {
        await timeout(10);
        if (Date.now() > max_t) {
            alert("Never finished waiting!" + (typeof msg === 'string' ? msg : msg()))
	    throw Error();
        }
    }
    if (!fn()) {
        alert("Something went wrong after waiting!" + (typeof msg === 'string' ? msg : msg()))
	throw Error();
    }
}

let testing = false;

async function main() {
    await waitFor(() => $('.booking-classes button:contains(Resident Adult):not(:contains(Advance))').length === 1, "player type options")

    $('.booking-classes button:contains(Resident Adult):not(:contains(Advance))')[0].click()
    await waitFor(() => $('.players a').length === 4, () => " 4 players? " + $('.players a').length)
    $('.players a')[3].click()

    let found_time_slot = null;

    while (found_time_slot === null) {
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
        console.log("Found days", days.map((x) => $(x).text()).join("\n"))

        $(days[days.length-1]).click()
        await waitFor(() => $('div:contains(Loading Tee times)').length > 0, "loading tee times")
        await waitFor(() => $('div:contains(Loading Tee times)').length == 0, "done loading tee times")
        await timeout(100)
        function noTimesAvailable() {
            return $($("h1", $('#times .time')[0])[0]).text() === "No tee times available";
        }
        function hasTimesAvailable() {
            return $('#times .time .start').length > 0;
        }

        await waitFor(() => {return hasTimesAvailable() || noTimesAvailable()}, " wait for times to load")
        console.log("times avilable?", hasTimesAvailable(), "no times available?", noTimesAvailable())
        if (noTimesAvailable()) {
            continue;
        }

        let time_slot_items = $('#times .time');
        console.log("num start times", $('#times .time .start').length, "num time slots", time_slot_items.length)
        let intervals;
        if (testing) {
            intervals = [0, 24];
        } else {
            // 4-8 AM, 1-3 PM
            intervals = [[4, 8], [13, 15]];
        }
        
        for (let interval_i = 0; interval_i < intervals.length; interval_i++) {
            let interval = intervals[interval_i]
            for (let i = 0; i < time_slot_items.length; i++) {
                let time_slot_item = time_slot_items[i]
                let text = $('.start', time_slot_item).text()
                console.log("candidate time", text)

                let suffix = text.slice(text.length - 2);
                if (suffix !== 'pm' && suffix !== 'am') {
                    alert('error ask jeff, neither am or pm: ' + text)
                }
                text = text.slice(0, text.length - 2);
                let parts = text.split(':')
                let hours_since_midnight = parseInt(parts[0]) + (parseInt(parts[1]) / 60);
                if (suffix === 'pm') { hours_since_midnight = hours_since_midnight + 12; }
		console.log("Checking", interval[0], "<=", hours_since_midnight, "<=", interval[1], "?")
                if (hours_since_midnight >= interval[0] && hours_since_midnight <= interval[1]) {
                    console.log("Found!", time_slot_item);
                    found_time_slot = time_slot_item;
                    break;
                }
            }
            if (found_time_slot !== null) {
                break;
            }
        }
        
        if (found_time_slot === null) {
            console.log("failed for now?  only time slots available were outside of intervals", intervals)
        }
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
