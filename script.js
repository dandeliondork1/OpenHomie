

// Replace with your Geoapify API key
const apiKey = "cc50496e1b5d49538867accb9c51ad98";

let userLat = null;
let userLng = null;
let currentRoute = null;

let userMarker = null;
let activeMarker = null;

// Initialize the map
const map = L.map('map').setView([14.5995, 120.9842], 13);


// Custom Reset Control
const resetControl = L.control({ position: 'bottomright' });

resetControl.onAdd = function () {
    const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

    div.innerHTML = `
        <button id="resetRouteBtn" style="
        background: none;
        border: none;
        cursor: pointer;
    ">
        <img src="putos/reset.png" alt="Reset Route" style="width: 50px; height: auto; object-fit: contain;">
    </button>
`;

    // Prevent map click when pressing button
    L.DomEvent.disableClickPropagation(div);

    return div;
};

resetControl.addTo(map);

// Add event listener AFTER adding to map
document.addEventListener("click", function (e) {
    if (e.target.id === "resetRouteBtn" || e.target.closest('#resetRouteBtn')) {
        resetMap();
    }
});
// Ask user manually first
let allowLocation = localStorage.getItem("allowLocation");

if (allowLocation === null) {
    allowLocation = confirm("Do you want to share your location?");
    localStorage.setItem("allowLocation", allowLocation);
} else {
    allowLocation = allowLocation === "true";
}

// Custom marker icons
const redIcon = new L.Icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

const blueIcon = new L.Icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

const greenIcon = new L.Icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});


if (allowLocation) {

    // Check if location already saved
    const savedLat = localStorage.getItem("userLat");
    const savedLng = localStorage.getItem("userLng");

    if (savedLat && savedLng) {
        userLat = parseFloat(savedLat);
        userLng = parseFloat(savedLng);

        setUserMarker(userLat, userLng);

    } else if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
            function (position) {
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;

                // Save to localStorage
                localStorage.setItem("userLat", userLat);
                localStorage.setItem("userLng", userLng);

                setUserMarker(userLat, userLng);
            },
            function () {
                alert("Location access denied or unavailable.");
            }
        );

    } else {
        alert("Geolocation is not supported by your browser.");
    }

} else {
    alert("Location access was not allowed.");
}
function setUserMarker(lat, lng) {

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker([lat, lng], {
        title: "Your Location"
    }).addTo(map);

    userMarker.bindPopup("You are here").openPopup();
    map.setView([lat, lng], 14);
}

function clearMapForRoute() {

    // Remove ALL layers (markers)
    hospitalLayer.clearLayers();
    clinicLayer.clearLayers();
    centerLayer.clearLayers();

    // Remove route
    if (currentRoute) {
        map.removeLayer(currentRoute);
        currentRoute = null;
    }

    // Remove selected marker
    if (activeMarker) {
        map.removeLayer(activeMarker);
        activeMarker = null;
    }
}

// Add Geoapify tile layer
L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors, HOT'
}).addTo(map);

function drawRoute(fromLat, fromLng, toLat, toLng) {

    if (!fromLat || !fromLng) {
        alert("User location not found.");
        return;
    }

    const url = `https://api.geoapify.com/v1/routing?waypoints=${fromLat},${fromLng}|${toLat},${toLng}&mode=drive&apiKey=${apiKey}`;

    fetch(url)
        .then(res => res.json())
        .then(result => {

            console.log(result); // DEBUG

            if (!result.features || result.features.length === 0) {
                alert("No route found.");
                return;
            }

            let coords = result.features[0].geometry.coordinates;

            // Handle MultiLineString
            if (result.features[0].geometry.type === "MultiLineString") {
                coords = coords.flat();
            }
            const latlngs = coords.map(coord => [coord[1], coord[0]]);

            if (currentRoute) {
                map.removeLayer(currentRoute);
            }

            currentRoute = L.polyline(latlngs, {
                color: 'blue',
                weight: 5
            }).addTo(map);

            const bounds = currentRoute.getBounds();

            if (bounds.isValid()) {
                map.fitBounds(bounds.pad(0.3));

            }
            map.eachLayer(layer => {
                if (layer instanceof L.TileLayer) {
                    layer.redraw();
                }
            });

            // ✅ Force redraw
            setTimeout(() => {
                map.invalidateSize();
            }, 300);
        })
        .catch(err => {
            console.log("Routing error:", err);
            alert("Error loading route.");
        });
}

const locations = [
    //CaviteC
    {
        name: "Major Danilo Atienza Hospital",
        lat: 14.49441,
        lng: 120.90496,
        type: "hospital"
    },
    {
        name: "Cavite Naval Hospital",
        lat: 14.48336,
        lng: 120.91603,
        type: "hospital"
    },
    {
        name: "Dela Cruz Maternity Hospital",
        lat: 14.483539234732962,
        lng: 120.89480893595129,
        type: "hospital"
    },
    {
        name: "Dr. Olivia Salamanca Memorial District Hospital",
        lat: 14.481210707509472,
        lng: 120.91150215586815,
        type: "hospital"
    },
    {
        name: "Cavite City MedCare Hospital",
        lat: 14.481210707509472,
        lng: 120.91150215586815,
        type: "hospital"
    },
    {
        name: "Bautista Hospital Medical Arts Bldg.",
        lat: 14.477961970657574,
        lng: 120.89365575109491,
        type: "hospital"
    },
    {
        name: "Bautista Hospital",
        lat: 14.477299014328048,
        lng: 120.89202080697235,
        type: "hospital"
    },
    {
        name: "Cavite City Medcare Hospital Sea Breeze",
        lat: 14.470140954502439,
        lng: 120.89071291636074,
        type: "hospital"
    },
    {
        name: "Cavite Medical Center Hospital",
        lat: 14.46341316622773,
        lng: 120.88197738770188,
        type: "hospital"
    },
    //Noveleta
    {
        name: "St. Martin Maternity & Pediatric Hospital",
        lat: 14.425734379769859,
        lng: 120.87430883243691,
        type: "hospital"

    },
    {
        name: "Noveleta Medcare Center Hospital",
        lat: 14.427124564732528,
        lng: 120.88145545644119,
        type: "hospital"

    },
    //Kawit

    {
        name: "San Pedro Calungsod Medical Hospital",
        lat: 14.427867651918943,
        lng: 120.89471327803926,
        type: "hospital"

    },
    {
        name: "Kawit Maternity and General Hospital",
        lat: 14.446641926019716,
        lng: 120.90617512659847,
        type: "hospital"

    },
    {
        name: "Binakayan Hospital and Medical Center, Inc.",

        lat: 14.45178165442842,
        lng: 120.92590769979778,
        type: "hospital"

    },
    {
        name: "Kawit Kalayaan Hospital",
        lat: 14.416843608208469,
        lng: 120.89863333283998,
        type: "hospital"

    },
    //Bacoor
    {
        name: "Crisostomo General Hospital",
        lat: 14.44927529822617,
        lng: 120.93332624134113,
        type: "hospital"

    },
    {
        name: "Southern Tagalog Regional Hospital",
        lat: 14.441445820988376,
        lng: 120.94731499794439,
        type: "hospital"

    },
    {
        name: "Bacoor Doctors Medical Hospital",
        lat: 14.419850227580692,
        lng: 120.96777135202008,
        type: "hospital"

    },
    {
        name: "Molino Doctors Hospital",
        lat: 14.410572597995552,
        lng: 120.97597786758959,
        type: "hospital"

    },
    {
        name: "Cavite East Asia Medical Center & Hospital Inc.",
        lat: 14.40593433157762,
        lng: 120.97677014364088,
        type: "hospital"

    },
    //Imus
    {
        name: "Imus Family Hospital",
        lat: 14.432551221998265,
        lng: 120.94630231545011,
        type: "hospital"

    },
    {
        name: "Our Lady of the Pillar Medical Center",
        lat: 14.41932056782192,
        lng: 120.93917481794539,
        type: "hospital"

    },
    {
        name: "Medical Center Imus",
        lat: 14.426274790637232,
        lng: 120.94613160021916,
        type: "hospital"

    },
    {
        name: "Paredes Medical Center and Hospital",
        lat: 14.412949875661061,
        lng: 120.94063544937808,
        type: "hospital"

    },
    {
        name: "Imus Health Hospital",
        lat: 14.409790520443106,
        lng: 120.93697790951838,
        type: "hospital"

    },
    {
        name: "South Imus Specialist Hospital",
        lat: 14.376643762208706,
        lng: 120.93466559743005,
        type: "hospital"

    },
    //Rosario
    {
        name: "Our Savior Hospital",
        lat: 14.414273977209003,
        lng: 120.85643514356002,
        type: "hospital"

    },
    {
        name: "Costa Verde Diagnostics Hospital",
        lat: 14.410192480988776,
        lng: 120.85697241996837,
        type: "hospital"

    },
    {
        name: "FirstCare Medical Services Hospital",
        lat: 14.410307713918554,
        lng: 120.8574015820875,
        type: "hospital"

    },
    //General Trias
    {
        name: "GT Hospital",
        lat: 14.396674246581368,
        lng: 120.86305207731097,
        type: "hospital"

    },
    {
        name: "Divine Grace Medical Center Hospital",
        lat: 14.397953254399457,
        lng: 120.86817466192205,
        type: "hospital"

    },
    {
        name: "City of General Trias Medicare Hospital",
        lat: 14.373976010795168,
        lng: 120.88201381834533,
        type: "hospital"

    },
    {
        name: "Gentri Medical Center And Hospital Inc.",
        lat: 14.289334005347087,
        lng: 120.90709787972143,
        type: "hospital"

    },
    {
        name: "Gentridoctors",
        lat: 14.291054437365718,
        lng: 120.90393769301673,
        type: "hospital"

    },
    //Tanza
    {
        name: "Tanza Specialists Medical Center Hospital",
        lat: 14.393826082597291,
        lng: 120.85337701629702,
        type: "hospital"

    },
    {
        name: "Tanza Family General Hospital & Pharmacy",
        lat: 14.390379438018334,
        lng: 120.84908580710288,
        type: "hospital"

    },
    {
        name: "Tanza Doctors Hospital",
        lat: 14.366302037076792,
        lng: 120.81731991326377,
        type: "hospital"

    },
    //Naic
    {
        name: "Amisa Medical Mission Hospital",
        lat: 14.32933180859538,
        lng: 120.7785418919154,
        type: "hospital"

    },
    {
        name: "Naic Medicare Hospital",
        lat: 14.327158905113757,
        lng: 120.77596346592765,
        type: "hospital"

    },
    {
        name: "Naic Doctors Hospital",
        lat: 14.314515722327958,
        lng: 120.77101320357177,
        type: "hospital"

    },
    //Maragondon
    {
        name: "Cavite Municipal Hospital Maragondon",
        lat: 14.277422410419897,
        lng: 120.7338626061458,
        type: "hospital"

    },
    //Trece
    {
        name: "M. V. Santiago Medical Center",
        lat: 14.294349270195104,
        lng: 120.86626967605036,
        type: "hospital"

    },
    {
        name: "DBB Municipal Hospital",
        lat: 14.280559456447225,
        lng: 120.86731484633852,
        type: "hospital"

    },
    {
        name: "TRECEÑO MEDICAL HOSPITAL",
        lat: 14.276660343772722,
        lng: 120.87005685109315,
        type: "hospital"

    },
    {
        name: "Gen. Emilio Aguinaldo Memorial Hospital",
        lat: 14.276146198337063,
        lng: 120.86957585182283,
        type: "hospital"
    },
    {
        name: "Korea-Philippines Friendship Hospital",
        lat: 14.275779359626604,
        lng: 120.87062244277718,
        type: "hospital"
    },
    //Indang
    {
        name: "Indang Main Hospital",
        lat: 14.200286154167618,
        lng: 120.8733009055129,
        type: "hospital"
    },
    //Dasmariñas
    {
        name: "Dasmariñas City Medical Center Hospital",
        lat: 14.353092208135983,
        lng: 120.98142199961987,
        type: "hospital"
    },
    {
        name: "GMF Hospital",
        lat: 14.328560364228867,
        lng: 120.93802041857793,
        type: "hospital"
    },
    {
        name: "De La Salle University Medical Center Hospital",
        lat: 14.32719308048344,
        lng: 120.94342853542491,
        type: "hospital"
    },
    {
        name: "Dasmariñas Doctors Hospital, Inc.",
        lat: 14.321987479212586,
        lng: 120.94335022286917,
        type: "hospital"
    },
    {
        name: "Prime Dasmariñas Medical Center",
        lat: 14.320686599850937,
        lng: 120.94188731366631,
        type: "hospital"
    },
    {
        name: "Medcor Dasmariñas Hospital and Medical Center",
        lat: 14.272601321527791,
        lng: 120.96592895702014,
        type: "hospital"
    },
    {
        name: "Asia Medic Family Hospital & Medical Center",
        lat: 14.298915010850399,
        lng: 120.95661669504427,
        type: "hospital"
    },
    {
        name: "M. V Santiago Medical Primary Hospital",
        lat: 14.291650838411401,
        lng: 120.93228719628864,
        type: "hospital"
    },
    {
        name: "St. Paul Hospital Cavite",
        lat: 14.323367618586019,
        lng: 120.96293985002218,
        type: "hospital"
    },
    {
        name: "Pagamutan ng Dasmariñas",
        lat: 14.32298934597502,
        lng: 120.96161924696592,
        type: "hospital"
    },
    //CENTER 
    //CAVITE CITY
    {
        name: "San Antonio Health Center",
        lat: 14.488159897114167,
        lng: 120.89640321796414,
        type: "center"
    },
    {
        name: "City Health Office",
        lat: 14.483354676530547,
        lng: 120.90895637536254,
        type: "center"
    },
    {
        name: "San Roque Health Center",
        lat: 14.483491207170024,
        lng: 120.90179203112679,
        type: "center"
    },
    {
        name: "Caridad Health Center",
        lat: 14.479856974155611,
        lng: 120.895949382142,
        type: "center"
    },
    {
        name: "STA.CRUZ HEALTH CENTER",
        lat: 14.471272521991194,
        lng: 120.88903835529905,
        type: "center"
    },
    {
        name: "Cavite HealthStart Medical and Diagnostic Center",
        lat: 14.470375071082465,
        lng: 120.89067235830305,
        type: "center"
    },


    {
        name: "Citi Care",
        lat: 14.429560689185077,
        lng: 120.88238370469982,
        type: "center"
    },
    {
        name: "MEDICROSS HEALTHCARE",
        lat: 14.428077924621268,
        lng: 120.87985257673174,
        type: "center"
    },
    {
        name: "Noveleta Health Center",
        lat: 14.427730948617006,
        lng: 120.88047846002698,
        type: "center"
    },
    {
        name: "Noveleta Operation Center",
        lat: 14.427551928751544,
        lng: 120.8812860303236,
        type: "center"
    },
    {
        name: "San Antonio 1 Barangay Health Center",
        lat: 14.425036136855551,
        lng: 120.88402168019302,
        type: "center"
    },
    {
        name: "Salcedo Ii Barangay Health Station",
        lat: 14.425681076765187,
        lng: 120.87374873743201,
        type: "center"
    },

    {
        name: "Bisita Barangay Health Center",
        lat: 14.447025037827894,
        lng: 120.92488521481415,
        type: "center"
    },
    {
        name: "Health A-8 Ultrasound Diagnostic Center Inc.",
        lat: 14.449015716431903,
        lng: 120.91978415279883,
        type: "center"
    },
    {
        name: "Tabon Health Center",
        lat: 14.44163242557513,
        lng: 120.90392831774003,
        type: "center"
    },
    {
        name: "SHFC COMMUNITY PRIMARY CARE CENTER",
        lat: 14.442823354121224,
        lng: 120.90315946408045,
        type: "center"
    },
    {
        name: "Reyes Medical & Maternity Center",
        lat: 14.440770227775532,
        lng: 120.90195306156468,
        type: "center"
    },
    {
        name: "Kawit Rural Health Center",
        lat: 14.44181236484838,
        lng: 120.90379270745005,
        type: "center"
    },
    {
        name: "Toclong Health Center",
        lat: 14.422781429298833,
        lng: 120.91495581631479,
        type: "center"
    },

    {
        name: "Miranda Health Center",
        lat: 14.459524143283327,
        lng: 120.92963692192973,
        type: "center"
    },
    {
        name: "Lingap Kalusugan City Health Unit",
        lat: 14.458658406679925,
        lng: 120.93772919493249,
        type: "center"
    },
    {
        name: "Talaba IV Health Center",
        lat: 14.460074940516037,
        lng: 120.9607858128325,
        type: "center"
    },
    {
        name: "Maluto Family Health Specialist Lying-In And Diagnostic Center",
        lat: 14.451142636290635,
        lng: 120.94995995395976,
        type: "center"
    },
    {
        name: "Well Point Medical Clinic and Diagnostic Center Inc.",
        lat: 14.448296092193706,
        lng: 120.95562754685835,
        type: "center"
    },
    {
        name: "Bacoor Rural Health Center II",
        lat: 14.448301120800515,
        lng: 120.95559401453332,
        type: "center"
    },
    {
        name: "Barangay Salinas II Health Center",
        lat: 14.441164443843265,
        lng: 120.9429063420999,
        type: "center"
    },
    {
        name: "Mabolo III Health Center",
        lat: 14.447463670665343,
        lng: 120.92912393198176,
        type: "center"
    },
    {
        name: "Health Center Salinas",
        lat: 14.44009386008046,
        lng: 120.93551861326604,
        type: "center"
    },
    {
        name: "Real 1 Health Center Bacoor Cavite",
        lat: 14.43371791435422,
        lng: 120.93800788388562,
        type: "center"
    },
    {
        name: "Palico Health Center",
        lat: 14.42280516288879,
        lng: 120.95853846793565,
        type: "center"
    },
    {
        name: "MOLINO I - Health Center",
        lat: 14.422181006953542,
        lng: 120.9750909426005,
        type: "center"
    },
    {
        name: "Bacoor City Health Center",
        lat: 14.43116439782423,
        lng: 120.96858591832924,
        type: "center"
    },

    {
        name: "Health Center Toclong 2b",
        lat: 14.440055803140847,
        lng: 120.9296262081811,
        type: "center"
    },
    {
        name: "Velarde Health Center",
        lat: 14.437878542775184,
        lng: 120.92779748540138,
        type: "center"
    },
    {
        name: "Carsadang Bago 1 Health Center",
        lat: 14.429019572420037,
        lng: 120.92898967439358,
        type: "center"
    },
    {
        name: "Imus City Health Office",
        lat: 14.429316981061035,
        lng: 120.93493866121527,
        type: "center"
    },
    {
        name: "Medical Center Imus",
        lat: 14.426255660360862,
        lng: 120.94612536788652,
        type: "center"
    },
    {
        name: "Imus Super Health Center",
        lat: 14.4224795243121,
        lng: 120.9312873552512,
        type: "center"
    },
    {
        name: "Bayan Luma Health Center",
        lat: 14.4098631587324,
        lng: 120.93695952521058,
        type: "center"
    },
    {
        name: "Bucandala III HEALTH CENTER",
        lat: 14.410189377953461,
        lng: 120.92495996507826,
        type: "center"
    },
    {
        name: "Barangay Health Center - Anabu IB",
        lat: 14.403691604950033,
        lng: 120.93917213627878,
        type: "center"
    },
    {
        name: "AVA Medical Center",
        lat: 14.395503109951106,
        lng: 120.93967655632635,
        type: "center"
    },
    {
        name: "Imus Extension Health Center",
        lat: 14.395944107009244,
        lng: 120.96852115847865,
        type: "center"
    },

    {
        name: "Bagbag 1 health center",
        lat: 14.422018379805682,
        lng: 120.86892213263206,
        type: "center"
    },
    {
        name: "Ligtong 4 health center",
        lat: 14.426393651251212,
        lng: 120.86638355160918,
        type: "center"
    },
    {
        name: "Rosario Municipal Health Center",
        lat: 14.417018055207155,
        lng: 120.8556369081011,
        type: "center"
    },
    {
        name: "High Integrated Diagnostics And Wellness Center",
        lat: 14.417786950188948,
        lng: 120.85572266220049,
        type: "center"
    },
    {
        name: "Biohealth Medical Clinic & Diagnostics Corporation",
        lat: 14.411747849614397,
        lng: 120.85805980264996,
        type: "center"
    },
    {
        name: "Wawa III Barangay Health Station",
        lat: 14.406490647188017,
        lng: 120.84929820260126,
        type: "center"
    },
    {
        name: "Kaiser Medical Center - EPZA Cavite",
        lat: 14.407571922828657,
        lng: 120.86158227430616,
        type: "center"
    },
    {
        name: "Sto. Domigo Medical",
        lat: 14.405207882202735,
        lng: 120.8597820750342,
        type: "center"
    },
    {
        name: "LabLife Medical and Diagnostic Center",
        lat: 14.402313687080596,
        lng: 120.85980161203068,
        type: "center"
    },

    {
        name: "General Trias City Health Office",
        lat: 14.373983204974172,
        lng: 120.88200953743419,
        type: "center"
    },
    {
        name: "City of General Trias Superhealth Center",
        lat: 14.329232377424681,
        lng: 120.9121437043669,
        type: "center"
    },
    {
        name: "Center For Health Services Inc.",
        lat: 14.310439412443552,
        lng: 120.91625001521886,
        type: "center"
    },
    {
        name: "Annex City Health Center",
        lat: 14.297339803931695,
        lng: 120.90996742302264,
        type: "center"
    },
    {
        name: "DE FUEGO BARANGAY HEALTH STATION",
        lat: 14.291831414428373,
        lng: 120.92837815029175,
        type: "center"
    },

    {
        name: "San Pedro Barangay Health Center",
        lat: 14.398081159603514,
        lng: 120.85581665140602,
        type: "center"
    },
    {
        name: "Tanza Municipal Health Center And Lying In",
        lat: 14.39262578436934,
        lng: 120.85519355699462,
        type: "center"
    },
    {
        name: "Sto. Niño De Tanza Medical and Diagnostic Center",
        lat: 14.391225488489065,
        lng: 120.8528123320102,
        type: "center"
    },
    {
        name: "Julugan IV Brgy. Health Center",
        lat: 14.403660970180983,
        lng: 120.8416848535117,
        type: "center"
    },
    {
        name: "Postema Sahud Ulan Health Center",
        lat: 14.37928049671355,
        lng: 120.82614547600365,
        type: "center"
    },
    {
        name: "Bagtas Health Center",
        lat: 14.334698758009512,
        lng: 120.85355164332701,
        type: "center"
    },
    {
        name: "Santol Barangay Health Center",
        lat: 14.375449812478351,
        lng: 120.87341778426831,
        type: "center"
    },

    {
        name: "FAR Diagnostic Center",
        lat: 14.328449523326253,
        lng: 120.77797369700653,
        type: "center"
    },
    {
        name: "NAIC RHU - MAIN",
        lat: 14.318967485923192,
        lng: 120.76455070101173,
        type: "center"
    },
    {
        name: "Brgy. Calubcob Health Care Center",
        lat: 14.294198475635447,
        lng: 120.78436828043769,
        type: "center"
    },
    {
        name: "Halang Health Center",
        lat: 14.29268295101415,
        lng: 120.80107365708882,
        type: "center"
    },

    {
        name: "Maragondon Rural Health Unit",
        lat: 14.275553557403535,
        lng: 120.73519916156003,
        type: "center"
    },
    {
        name: "Brgy Pinagsanhan A Health Center",
        lat: 14.270958002261331,
        lng: 120.73379161996439,
        type: "center"
    },
    {
        name: "Brgy Pantihan 1 Health Center",
        lat: 14.261897905935848,
        lng: 120.7904157364688,
        type: "center"
    },

    {
        name: "Golden Horizon Health Station Centre",
        lat: 14.301845618818186,
        lng: 120.89193840427413,
        type: "center"
    },
    {
        name: "Trece City Health Office",
        lat: 14.28133932563408,
        lng: 120.86966366814427,
        type: "center"
    },
    {
        name: "Cavite Center for Mental Health",
        lat: 14.277302018967186,
        lng: 120.86975127279874,
        type: "center"
    },
    {
        name: "COLORADO Multispecialty Clinic and Diagnostic Center",
        lat: 14.274088345230892,
        lng: 120.86703404950454,
        type: "center"
    },

    {
        name: "Lumampong Halayhay Brgy Health Center",
        lat: 14.161447787663876,
        lng: 120.85994405417672
    },
    {
        name: "Indang Health Facility",
        lat: 14.178399323585179,
        lng: 120.86808235830486
    },
    {
        name: "Common Care Medical Center and Laboratory",
        lat: 14.192317371785773,
        lng: 120.87861103681625
    },
    {
        name: "M.V. Santiago Medical and Diagnostic Center",
        lat: 14.196915498122824,
        lng: 120.87679269809772
    },
    {
        name: "Indang Main Health Center",
        lat: 14.200272780516169,
        lng: 120.87325087505599
    },

    {
        name: "Salitran Barangay Health Center",
        lat: 14.351070227493903,
        lng: 120.93979171629096
    },
    {
        name: "Emilio Aguinaldo College Medical Center",
        lat: 14.348649428782089,
        lng: 120.93981225731403
    },
    {
        name: "Sabang Health Center",
        lat: 14.347920298985194,
        lng: 120.92464611297562
    },
    {
        name: "Barangay San Esteban Community's Health Center",
        lat: 14.338502534586821,
        lng: 120.95686933262701
    },
    {
        name: "DASMARIÑAS CITY HEALTH OFFICE IV",
        lat: 14.31820214976935,
        lng: 120.98238048353245
    },
    {
        name: "Bautista Health Center",
        lat: 14.313840524252681,
        lng: 120.97391881508113
    },
    {
        name: "Barangay Santa Fe Health Center",
        lat: 14.320191307908981,
        lng: 120.96451221611582
    },
    //CLINICS
    //CAVITE
    {
        name: "Espiritu Clinic",
        lat: 14.488591121078695,
        lng: 120.89997007737634,
        type: "clinic"
    },
    {
        name: "Aquino Medical and Maternity Clinic Co.",
        lat: 14.48211052886451,
        lng: 120.90824271220602,
        type: "clinic"
    },
    {
        name: "Since Vidad Optemetric Clinic",
        lat: 14.480785010595378,
        lng: 120.90356620975169,
        type: "clinic"
    },
    {
        name: "Soliven Dental Clinic",
        lat: 14.481585554247452,
        lng: 120.90124633169025,
        type: "clinic"
    },
    {
        name: "San Roque Medical Clinic",
        lat: 14.481576754766536,
        lng: 120.90074634195473,
        type: "clinic"
    },
    {
        name: "MEDPORT Medical Clinic",
        lat: 14.48326916196305,
        lng: 120.90188031893804,
        type: "clinic"
    },
    {
        name: "Tirona EENT Medical Clinic",
        lat: 14.48131911047539,
        lng: 120.89794351617863,
        type: "clinic"
    },
    {
        name: "Rojas Medical Clinic",
        lat: 14.480452158520427,
        lng: 120.90154804092279,
        type: "clinic"
    },
    {
        name: "FamilyDOC Cavite City",
        lat: 14.480486418419662,
        lng: 120.90083214536595,
        type: "clinic"
    },
    {
        name: "Cavite Skin Clinic",
        lat: 14.478932613367792,
        lng: 120.89687029227241,
        type: "clinic"
    },
    {
        name: "Udasco Clinic",
        lat: 14.478506526513724,
        lng: 120.89515119070572,
        type: "clinic"
    },
    {
        name: "l.a Llamado Medical And Family Clinic",
        lat: 14.47647504509461,
        lng: 120.89087799406316,
        type: "clinic"
    },
    {
        name: "Fonseca's Maternity And Lying-in Clinic",
        lat: 14.437407032035535,
        lng: 120.87774665502194,
        type: "clinic"
    },
    {
        name: "Oliver Dental Clinic",
        lat: 14.437667832639978,
        lng: 120.88319566600362,
        type: "clinic"
    },
    {
        name: "Nierva's Dental Clinic",
        lat: 14.434253433384368,
        lng: 120.878064229728,
        type: "clinic"
    },
    {
        name: "JCB DONES MATERNITY CLINIC",
        lat: 14.433958688179562,
        lng: 120.87824590659045,
        type: "clinic"
    },
    {
        name: "VillaBlanca Family Clinic",
        lat: 14.430334264724843,
        lng: 120.87916623173956,
        type: "clinic"
    },
    {
        name: "Noveleta Lying-in Center",
        lat: 14.43171584546846,
        lng: 120.88522100159938,
        type: "clinic"
    },
    {
        name: "Clinica Dermatologica Aesthetica",
        lat: 14.430648318320474,
        lng: 120.88410145323034,
        type: "clinic"
    },
    {
        name: "ACC Orthopedic and Physical Therapy Clinic",
        lat: 14.429866714938559,
        lng: 120.88332266129453,
        type: "clinic"
    },
    {
        name: "LA Naval Speciality Clinic",
        lat: 14.428874394845508,
        lng: 120.88140486080884,
        type: "clinic"
    },
    {
        name: "Noveleta Multi-Specialty Clinic",
        lat: 14.42797103507169,
        lng: 120.8811739926988,
        type: "clinic"
    },
    {
        name: "Guelos Lying-In Clinic",
        lat: 14.426518286110333,
        lng: 120.88208443368548,
        type: "clinic"
    },
    {
        name: "Vista Medical Clinic",
        lat: 14.427210155823797,
        lng: 120.87693230566146,
        type: "clinic"
    },
    {
        name: "Kawit Lying-In Clinic",
        lat: 14.455790778905032,
        lng: 120.92085675847534,
        type: "clinic"
    },
    {
        name: "Brightlane Medical Clinic",
        lat: 14.450731793411,
        lng: 120.9261333622396,
        type: "clinic"
    },
    {
        name: "Clinica Avancena Maternity Clinic and Lying-in Clinic",
        lat: 14.450426203146897,
        lng: 120.92636194869421,
        type: "clinic"
    },
    {
        name: "Camaclang Medical Clinic",
        lat: 14.450235925279804,
        lng: 120.92544046101496,
        type: "clinic"
    },
    {
        name: "Ignacio - De Mesa Eye Specialist Clinic",
        lat: 14.450383948533755,
        lng: 120.92500587055174,
        type: "clinic"
    },
    {
        name: "ESCA Clinic",
        lat: 14.449952069037355,
        lng: 120.92459311452849,
        type: "clinic"
    },
    {
        name: "Angel's Crib Lying-in and Maternity Clinic",
        lat: 14.448781129426699,
        lng: 120.91907310599218,
        type: "clinic"
    },
    {
        name: "E-Konsulta Medical Clinic",
        lat: 14.44843164333294,
        lng: 120.91805925694577,
        type: "clinic"
    },
    {
        name: "ZSTM MEDICAL CLINIC",
        lat: 14.440175605511914,
        lng: 120.91086045396155,
        type: "clinic"
    },
    {
        name: "Sacred Heart Medical Clinic",
        lat: 14.4447588345503,
        lng: 120.90566589582754,
        type: "clinic"
    },
    {
        name: "Cure Health Diagnostic and Ultrasound Clinic",
        lat: 14.434175405546453,
        lng: 120.90032227326583,
        type: "clinic"
    },
    {
        name: "Bacoor Pediatric Clinic",
        lat: 14.46078025800131,
        lng: 120.95462978017132,
        type: "clinic"
    },
    {
        name: "Twindent Dental Clinic",
        lat: 14.46080234583985,
        lng: 120.95416626242246,
        type: "clinic"
    },
    {
        name: "Pagtakhan Medical Clinic",
        lat: 14.460601741892786,
        lng: 120.95340945105484,
        type: "clinic"
    },
    {
        name: "Doc Rina Pediatric Clinic",
        lat: 14.460073350990314,
        lng: 120.95355473949303,
        type: "clinic"
    },
    {
        name: "Pagtakhan Medical Clinic",
        lat: 14.458391424943313,
        lng: 120.95360383304124,
        type: "clinic"
    },
    {
        name: "Cadiente Medical Clinic",
        lat: 14.454443887150282,
        lng: 120.95774219539376,
        type: "clinic"
    },
    {
        name: "Medical Options Clinic",
        lat: 14.446105500356683,
        lng: 120.94873320658763,
        type: "clinic"
    },
    {
        name: "Cuenca Family Clinic",
        lat: 14.44737620136844,
        lng: 120.9438138082612,
        type: "clinic"
    },
    {
        name: "OzonMed Wellness Clinic",
        lat: 14.447722850755529,
        lng: 120.94096960430456,
        type: "clinic"
    },
    {
        name: "St, Michael & St. Claire Lying-In Medical Clinic",
        lat: 14.449368966549589,
        lng: 120.94315293428875,
        type: "clinic"
    },
    {
        name: "Queens Medical Clinic",
        lat: 14.402925429045204,
        lng: 120.98786402363488,
        type: "clinic"
    },
    {
        name: "Doc Aid Diagnostic Center and Medical Clinic",
        lat: 14.39014289657379,
        lng: 120.97744017637808,
        type: "clinic"
    },
    {
        name: "Big Care Medical and Diagnostic Clinic",
        lat: 14.430208837685283,
        lng: 120.9380231119324,
        type: "clinic"
    },
    {
        name: "Virata Medical Clinic",
        lat: 14.427783799724448,
        lng: 120.93337003001304,
        type: "clinic"
    },
    {
        name: "Consulta Medical",
        lat: 14.427940196207269,
        lng: 120.93778950696164,
        type: "clinic"
    },
    {
        name: "Chemster Medical Clinic",
        lat: 14.429973786229372,
        lng: 120.94574267213942,
        type: "clinic"
    },
    {
        name: "Mary Immaculate Medical Clinic",
        lat: 14.42534786906761,
        lng: 120.93932561173054,
        type: "clinic"
    },
    {
        name: "Ilano's Medical Clinic",
        lat: 14.42407999863264,
        lng: 120.94110210569109,
        type: "clinic"
    },
    {
        name: "Imus Medical Specialist Clinic",
        lat: 14.422905267263905,
        lng: 120.94172748743831,
        type: "clinic"
    },
    {
        name: "Maxicare Primary Care Clinic",
        lat: 14.40619461016913,
        lng: 120.9403529916899,
        type: "clinic"
    },
    {
        name: "The Medical City Clinic - SM Imus",
        lat: 14.40177634856925,
        lng: 120.93967228193705,
        type: "clinic"
    },
    {
        name: "Healthway - The District Clinic",
        lat: 14.37102924937664,
        lng: 120.93938441371068,
        type: "clinic"
    },
    {
        name: "JAMedical Clinic",
        lat: 14.42441790621244,
        lng: 120.87164069544404,
        type: "clinic"
    },
    {
        name: "Jagolino Medical Clinic",
        lat: 14.420255074701029,
        lng: 120.86882497211712,
        type: "clinic"
    },
    {
        name: "Jimenez Medical Clinic",
        lat: 14.41901032040504,
        lng: 120.85729038701263,
        type: "clinic"
    },
    {
        name: "Sunny Dental Clinic",
        lat: 14.41667998939301,
        lng: 120.85731880484522,
        type: "clinic"
    },
    {
        name: "Rosario Maternity And Medical Emergency Clinic",
        lat: 14.416472563804499,
        lng: 120.85607721507353,
        type: "clinic"
    },
    {
        name: "Rosario Medical Clinic",
        lat: 14.414977038453436,
        lng: 120.85648252029941,
        type: "clinic"
    },
    {
        name: "Biohealth Medical Clinic",
        lat: 14.411748442372737,
        lng: 120.85811646352813,
        type: "clinic"
    },
    {
        name: "MV SANTIAGO HEALTH SERVICES",
        lat: 14.4085571383442,
        lng: 120.85874640074894,
        type: "clinic"
    },
    {
        name: "Prima Care Medical Laboratory and Clinic",
        lat: 14.405304831034039,
        lng: 120.8598012854047,
        type: "clinic"
    },
    {
        name: "HERNANDEZ HEALTH HUB Clinic",
        lat: 14.403621974374714,
        lng: 120.86055930967659,
        type: "clinic"
    },
    {
        name: "HMICare Clinic and Diagnostic Center",
        lat: 14.40786971950301,
        lng: 120.8782809907895,
        type: "clinic"
    },
    {
        name: "R.G.O. Laboratory and Industrial Diagnostic Center Inc.",
        lat: 14.405431440493635,
        lng: 120.8777266573507,
        type: "clinic"
    },
    {
        name: "Maxicare Primary Care Clinic",
        lat: 14.396689699620742,
        lng: 120.86443192404569,
        type: "clinic"
    },
    {
        name: "MAYCARE ULTRASOUND AND BIRTHING CLINIC",
        lat: 14.387003244187982,
        lng: 120.87702833229622,
        type: "clinic"
    },
    {
        name: "Mediran Dental Clinic",
        lat: 14.388077891065699,
        lng: 120.88329709034393,
        type: "clinic"
    },
    {
        name: "Accucheck Diagnostic Clinic",
        lat: 14.38656699202897,
        lng: 120.88294437082965,
        type: "clinic"
    },
    {
        name: "Healthwealth Medical Specialist",
        lat: 14.388149748040924,
        lng: 120.89603113449284,
        type: "clinic"
    },
    {
        name: "Escuadro Medical Clinic",
        lat: 14.382969765993028,
        lng: 120.87869624164654,
        type: "clinic"
    },
    {
        name: "The OPD Clinic",
        lat: 14.386742085995275,
        lng: 120.87756914401841,
        type: "clinic"
    },
    {
        name: "Healthflex Medical Clinic and Laboratory",
        lat: 14.36823197273731,
        lng: 120.89096204060122,
        type: "clinic"
    },
    {
        name: "ClinicPal Medical and Diagnostic Clinic",
        lat: 14.336832530144928,
        lng: 120.91335078908403,
        type: "clinic"
    },
    {
        name: "A.D Medical Clinic",
        lat: 14.332635679616835,
        lng: 120.92185263141019,
        type: "clinic"
    },
    {
        name: "Firstcare Medical Services Inc.",
        lat: 14.292697506403073,
        lng: 120.91069574174033,
        type: "clinic"
    },
    {
        name: "Wellcare Clinics & Lab.",
        lat: 14.292264589503848,
        lng: 120.90884415293856,
        type: "clinic"
    },
    {
        name: "A.A. Dones Dental Clinic",
        lat: 14.395368678628264,
        lng: 120.8603072938747,
        type: "clinic"
    },
    {
        name: "Firstline Medical and Diagnostic Clinic",
        lat: 14.394806690005417,
        lng: 120.85887927733766,
        type: "clinic"
    },
    {
        name: "MRA Medical Clinic",
        lat: 14.399770338686217,
        lng: 120.85639630992061,
        type: "clinic"
    },
    {
        name: "DONES MEDICAL CLINIC",
        lat: 14.391572800563269,
        lng: 120.85265079193788,
        type: "clinic"
    },
    {
        name: "Globalife Medical Laboratory & Polyclinic",
        lat: 14.390964187717355,
        lng: 120.85290230496628,
        type: "clinic"
    },
    {
        name: "Dr Chingbee's Clinic",
        lat: 14.388440012289298,
        lng: 120.84664385792307,
        type: "clinic"
    },
    {
        name: "DCEPS Medical Services Co.",
        lat: 14.386088416110308,
        lng: 120.84379389305576,
        type: "clinic"
    },
    {
        name: "The WHealth MD Clinic",
        lat: 14.386676734531013,
        lng: 120.8655886847712,
        type: "clinic"
    },
    {
        name: "AYMA Laboratory and Diagnostic Clinic",
        lat: 14.381580955421994,
        lng: 120.87303901215599,
        type: "clinic"
    },
    {
        name: "Lourdes R.Pacumio Lying-In & Family Care Clinic",
        lat: 14.367591019992588,
        lng: 120.85493941954603,
        type: "clinic"
    },
    {
        name: "Manas Medical Clinic",
        lat: 14.37063698714692,
        lng: 120.82376507001436,
        type: "clinic"
    },
    {
        name: "CALIBUYO LYING-IN CLINIC",
        lat: 14.359490366604371,
        lng: 120.81069896066596,
        type: "clinic"
    },
    {
        name: "Niño Gracito Medical Clinic",
        lat: 14.336919839592941,
        lng: 120.78891794068994,
        type: "clinic"
    },
    {
        name: "M.M.G Medical and Laboratory Clinic",
        lat: 14.32639905046622,
        lng: 120.77554596434175,
        type: "clinic"
    },
    {
        name: "Baldovino Medical Family Clinic",
        lat: 14.326756307952378,
        lng: 120.77552763907349,
        type: "clinic"
    },
    {
        name: "Tansiongco Pediatric Clinic",
        lat: 14.321910731681566,
        lng: 120.77221334571954,
        type: "clinic"
    },
    {
        name: "Cuddles and Cribs Lying-In Clinic",
        lat: 14.318795621613415,
        lng: 120.76420709569337,
        type: "clinic"
    },
    {
        name: "Balagtas clinic",
        lat: 14.317689103114944,
        lng: 120.7632687207937,
        type: "clinic"
    },
    {
        name: "Naic Holy Spirit Medical & Lying-in Clinic",
        lat: 14.31569129173035,
        lng: 120.76821786616864,
        type: "clinic"
    },
    {
        name: "Kiddie Care Clinic",
        lat: 14.315543103577715,
        lng: 120.76838072269197,
        type: "clinic"
    },
    {
        name: "Nazareno Medical Clinic",
        lat: 14.31223508982246,
        lng: 120.76939392819088,
        type: "clinic"
    },
    {
        name: "Halang Family Clinic",
        lat: 14.29385117445914,
        lng: 120.80191962408752,
        type: "clinic"
    },
    {
        name: "Kadels Multi Specialty Clinic",
        lat: 14.317486218638921,
        lng: 120.80470289482491,
        type: "clinic"
    },
    {
        name: "BVL DENTAL CLINIC",
        lat: 14.319789091478587,
        lng: 120.80363710043477,
        type: "clinic"
    },
    {
        name: "Soteria Medical Clinic",
        lat: 14.321581833910505,
        lng: 120.80675724350886,
        type: "clinic"
    },
    {
        name: "JaroMed & Diagnostic Center",
        lat: 14.354766276105192,
        lng: 120.93778168338007,
        type: "clinic"
    },
    {
        name: "Global Multi-Specialty Health and Wellness Clinic",
        lat: 14.350262287795795,
        lng: 120.93843853779056,
        type: "clinic"
    },
    {
        name: "MTLab Medical Clinic",
        lat: 14.348455564843034,
        lng: 120.93773299674059,
        type: "clinic"
    },
    {
        name: "TQM Multi Specialty Clinic and Pharmacy",
        lat: 14.344402290956406,
        lng: 120.9249202514126,
        type: "clinic"
    },
    {
        name: "Abc Mercado Diagnostic And Medical Clinic",
        lat: 14.343616764780384,
        lng: 120.92600171134634,
        type: "clinic"
    },
    {
        name: "Bien P. Rentoy Lying-in Clinic",
        lat: 14.328999215021604,
        lng: 120.93265561773654,
        type: "clinic"
    },
    {
        name: "Medicaport Medical Clinic & Laboratory",
        lat: 14.32778737491736,
        lng: 120.93505130685233,
        type: "clinic"
    },
    {
        name: "Central MED",
        lat: 14.326052490632588,
        lng: 120.93636792558473,
        type: "clinic"
    },
    {
        name: "Wellcare Clinics & Lab., Inc",
        lat: 14.325534050009342,
        lng: 120.94153843930974,
        type: "clinic"
    },
    {
        name: "Aventus Medical Care, Inc.",
        lat: 14.32653964889198,
        lng: 120.9444545400582,
        type: "clinic"
    },
    {
        name: "Wellcare Clinic and Laboratory",
        lat: 14.327006480081174,
        lng: 120.95046775560014,
        type: "clinic"
    },
    {
        name: "Apollo Hillside Clinic",
        lat: 14.323873170436304,
        lng: 120.96332011390564,
        type: "clinic"
    },
    {
        name: "CASTELO MEDICAL CLINIC",
        lat: 14.32338792674238,
        lng: 120.96673180643494,
        type: "clinic"
    },
    {
        name: "Noynay Medical Clinic",
        lat: 14.319858962763163,
        lng: 120.98757807377642,
        type: "clinic"
    },
    {
        name: "WellPoint Medical Clinic",
        lat: 14.301624473741095,
        lng: 120.9566402606288,
        type: "clinic"
    },
    {
        name: "HMICare Clinic & Diagnostic Center",
        lat: 14.29890923123633,
        lng: 120.9552688766674,
        type: "clinic"
    }

]
const hospitalLayer = L.layerGroup().addTo(map);
const clinicLayer = L.layerGroup().addTo(map);
const centerLayer = L.layerGroup().addTo(map);

// Add marker
locations.forEach(location => {

    let icon;
    let targetLayer;

    if (location.type === "hospital") {
        icon = redIcon;
        targetLayer = hospitalLayer;
    } else if (location.type === "clinic") {
        icon = blueIcon;
        targetLayer = clinicLayer;
    } else if (location.type === "center") {
        icon = greenIcon;
        targetLayer = centerLayer;
    } else {
        return; // skip if no type
    }

    const marker = L.marker([location.lat, location.lng], { icon: icon })
        .bindPopup(location.name);

    // Add marker to specific layer (NOT directly to map)
    targetLayer.addLayer(marker);

    // Click event for routing
    marker.on('click', function () {

        if (!userLat || !userLng) {
            alert("Waiting for your location. Please try again.");
            return;
        }

        // Clear EVERYTHING
        clearMapForRoute();

        // Add ONLY selected marker
        activeMarker = L.marker([location.lat, location.lng], { icon: icon })
            .addTo(map)
            .bindPopup(location.name)
            .openPopup();

        // Re-add user marker
        setUserMarker(userLat, userLng);

        // Draw route
        drawRoute(userLat, userLng, location.lat, location.lng);
    });
});
function showHospitals() {
    map.addLayer(hospitalLayer);
    map.removeLayer(clinicLayer);
    map.removeLayer(centerLayer);
}

function showClinics() {
    map.addLayer(clinicLayer);
    map.removeLayer(hospitalLayer);
    map.removeLayer(centerLayer);
}

function showCenters() {
    map.addLayer(centerLayer);
    map.removeLayer(hospitalLayer);
    map.removeLayer(clinicLayer);
}

function showAll() {
    map.addLayer(hospitalLayer);
    map.addLayer(clinicLayer);
    map.addLayer(centerLayer);
}

function resetMap() {

    // Remove route
    if (currentRoute) {
        map.removeLayer(currentRoute);
        currentRoute = null;
    }

    // Remove selected marker
    if (activeMarker) {
        map.removeLayer(activeMarker);
        activeMarker = null;
    }

    // CLEAR ALL layers first
    hospitalLayer.clearLayers();
    clinicLayer.clearLayers();
    centerLayer.clearLayers();

    // RE-ADD all markers
    locations.forEach(location => {

        let icon;
        let targetLayer;

        if (location.type === "hospital") {
            icon = redIcon;
            targetLayer = hospitalLayer;
        } else if (location.type === "clinic") {
            icon = blueIcon;
            targetLayer = clinicLayer;
        } else if (location.type === "center") {
            icon = greenIcon;
            targetLayer = centerLayer;
        } else {
            return;
        }

        const marker = L.marker([location.lat, location.lng], { icon: icon })
            .bindPopup(location.name);

        targetLayer.addLayer(marker);

        // REATTACH click event again
        marker.on('click', function () {

            if (!userLat || !userLng) {
                alert("Waiting for your location. Please try again.");
                return;
            }

            clearMapForRoute();

            activeMarker = L.marker([location.lat, location.lng], { icon: icon })
                .addTo(map)
                .bindPopup(location.name)
                .openPopup();

            setUserMarker(userLat, userLng);
            drawRoute(userLat, userLng, location.lat, location.lng);
        });
    });

    // Show all layers again
    showAll();

    // Restore user marker
    if (userLat && userLng) {
        setUserMarker(userLat, userLng);
    }
}