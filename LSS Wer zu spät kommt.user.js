// ==UserScript==
// @name         LSS Wer zu spät kommt...
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Überprüft, ob ein Fahrzeug rechtzeitig ankommt, bevor es einem Einsatz zugewiesen wird.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zur Umwandlung von Zeit (hh:mm:ss oder mm:ss) in Sekunden
    function convertTimeToSeconds(timeStr) {
        const timeParts = timeStr.split(':').map(Number);
        if (timeParts.length === 3) {
            const [hours, minutes, seconds] = timeParts;
            return hours * 3600 + minutes * 60 + seconds;
        } else if (timeParts.length === 2) {
            const [minutes, seconds] = timeParts;
            return minutes * 60 + seconds;
        }
        return 0;
    }

    // Funktion zur Überprüfung der Anfahrtzeit
    function checkVehicleArrivalTime() {
        // Mission Countdown überprüfen
        const missionCountdownElement = document.querySelector('span[id^="mission_countdown"]');
        if (!missionCountdownElement) return;

        const missionCountdownTime = missionCountdownElement.textContent.trim();
        const missionCountdownSeconds = convertTimeToSeconds(missionCountdownTime);
        //console.log(`Mission Countdown Time: ${missionCountdownTime} (${missionCountdownSeconds} Sekunden)`);

        // Projektierter Countdown überprüfen
        const projectedCountdownElement = document.querySelector('span[id^="mission_countdown"][id$="_projected"]');
        let projectedCountdownSeconds = 0;
        if (projectedCountdownElement) {
            const projectedCountdownTime = projectedCountdownElement.textContent.trim();
            projectedCountdownSeconds = convertTimeToSeconds(projectedCountdownTime);
            //console.log(`Projected Countdown Time: ${projectedCountdownTime} (${projectedCountdownSeconds} Sekunden)`);
        }

        // Größeren Countdown (normal oder projected) verwenden
        const finalCountdownSeconds = Math.max(missionCountdownSeconds, projectedCountdownSeconds);

        const vehicleListElement = document.getElementById('vehicle_list_step');
        if (!vehicleListElement) return;

        const vehicleRows = vehicleListElement.querySelectorAll('tr.vehicle_select_table_tr');

        vehicleRows.forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"].vehicle_checkbox');
            if (checkbox && checkbox.checked) {
                const travelTimeElement = row.querySelector('td:nth-child(4)');
                if (travelTimeElement) {
                    const travelTimeText = travelTimeElement.textContent.trim();
                    const travelTimeParts = travelTimeText.match(/(\d+)\s*Min\.\s*(\d+)\s*Sek\./);
                    if (travelTimeParts) {
                        const travelTimeSeconds = parseInt(travelTimeParts[1]) * 60 + parseInt(travelTimeParts[2]);
                        //console.log(`Fahrzeug Anfahrtzeit: ${travelTimeText} (${travelTimeSeconds} Sekunden)`);

                        if (travelTimeSeconds > finalCountdownSeconds) {
                            //console.log('Das Fahrzeug wird nicht rechtzeitig ankommen!');
                            alert('Das Fahrzeug wird nicht rechtzeitig ankommen!');
                        }
                    }
                }
            }
        });
    }

    // Originalen aaoClickHandler speichern
    const originalAaoClickHandler = window.aaoClickHandler;

    // Neuen aaoClickHandler definieren
    window.aaoClickHandler = function(e) {
        // Originalen aaoClickHandler aufrufen
        const result = originalAaoClickHandler(e);

        // Fahrzeugzeiten überprüfen
        checkVehicleArrivalTime();

        return result;
    };

    // Überwachung der Checkboxen und deren Änderungen
    function monitorCheckboxes() {
        const vehicleListElement = document.getElementById('vehicle_list_step');
        if (!vehicleListElement) return;

        const vehicleRows = vehicleListElement.querySelectorAll('tr.vehicle_select_table_tr');
        vehicleRows.forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"].vehicle_checkbox');
            if (checkbox) {
                // Event-Listener für Benutzeränderungen
                checkbox.addEventListener('change', checkVehicleArrivalTime);

                // MutationObserver für systemseitige Änderungen
                const observer = new MutationObserver(() => {
                    checkVehicleArrivalTime();
                });

                observer.observe(checkbox, {
                    attributes: true,
                    attributeFilter: ['checked']
                });
            }
        });
    }

    // MutationObserver zur Überwachung von Änderungen an der Fahrzeugliste
    const vehicleListElement = document.getElementById('vehicle_list_step');
    if (vehicleListElement) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    monitorCheckboxes();
                }
            });
        });

        observer.observe(vehicleListElement, {
            childList: true,
            subtree: true
        });

        // Initiales Monitoring
        monitorCheckboxes();
    }
})();
//... bekommt keinen Kuchen. Schrecklich!
