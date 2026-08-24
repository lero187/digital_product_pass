let variants = [];
let products = [];
let sizes = [];
let fits = [];
let materials = [];
let components = [];
let packagingMaterials = [];
let careProfiles = [];
let durabilityProfiles = [];
let repairProfiles = [];
let circularityProfiles = [];
let materialSources = [];
let companies = [];
let sites = [];
let departments = [];
let processes = [];
let processChains = [];
let processData = [];
let siteEnvironmental = [];
let transportModes = [];
let transportRoutes = [];


let currentRawTotals = {
    co2: 0,
    water: 0,
    energy: 0
};


let currentComponentTotals = {
    co2: 0,
    water: 0,
    energy: 0,
    massKg: 0
};


let currentPackagingTotals = {
    co2: 0,
    water: 0,
    energy: 0,
    massKg: 0
};


let currentProductionTotals = {
    co2: 0,
    water: 0,
    energy: 0
};


let currentTransportTotals = {
    co2: 0,
    energy: 0
};


/*
==================================================
JSON LADEN
==================================================
*/

async function loadJson(path) {

    const response =
        await fetch(path);


    if (!response.ok) {

        throw new Error(
            `Datei konnte nicht geladen werden: ${path}`
        );
    }


    return await response.json();
}


/*
==================================================
ALLGEMEINE DROPDOWNS
==================================================
*/

function fillSelect(
    selectId,
    data,
    defaultId = null
) {

    const select =
        document.getElementById(selectId);


    if (!select) {
        return;
    }


    select.innerHTML = "";


    data.forEach(item => {

        const option =
            document.createElement("option");


        option.value =
            item.id;


        option.textContent =
            item.name;


        option.selected =
            item.id === defaultId;


        select.appendChild(option);
    });
}


/*
==================================================
VARIANTEN
==================================================
*/

function fillVariantSelect() {

    const select =
        document.getElementById("variant");


    if (!select) {
        return;
    }


    select.innerHTML = "";


    variants.forEach(variant => {

        const option =
            document.createElement("option");


        option.value =
            variant.id;


        option.textContent =
            variant.name;


        select.appendChild(option);
    });
}


/*
==================================================
AKTUELLE SUMMEN ZURÜCKSETZEN
==================================================
*/

function resetCurrentTotals() {

    currentRawTotals = {
        co2: 0,
        water: 0,
        energy: 0
    };


    currentComponentTotals = {
        co2: 0,
        water: 0,
        energy: 0,
        massKg: 0
    };


    currentPackagingTotals = {
        co2: 0,
        water: 0,
        energy: 0,
        massKg: 0
    };


    currentProductionTotals = {
        co2: 0,
        water: 0,
        energy: 0
    };


    currentTransportTotals = {
        co2: 0,
        energy: 0
    };
}


/*
==================================================
PRODUKT-BERECHNUNGSGRUNDLAGE
==================================================
*/

function getProductCalculationBase() {

    const productSelect =
        document.getElementById("product");


    const sizeSelect =
        document.getElementById("size");


    const fitSelect =
        document.getElementById("fit");


    if (
        !productSelect ||
        !sizeSelect ||
        !fitSelect
    ) {

        return null;
    }


    const product =
        products.find(
            item =>
                item.id ===
                productSelect.value
        );


    const size =
        sizes.find(
            item =>
                item.id ===
                sizeSelect.value
        );


    const fit =
        fits.find(
            item =>
                item.id ===
                fitSelect.value
        );


    if (
        !product ||
        !size ||
        !fit
    ) {

        return null;
    }


    const fabricArea =
        product.baseFabricArea
        * size.fabricFactor
        * fit.fabricFactor;


    const totalFabricWeightGrams =
        fabricArea
        * product.fabricWeight;


    const totalFabricWeightKg =
        totalFabricWeightGrams
        / 1000;


    return {
        product,
        size,
        fit,
        fabricArea,
        totalFabricWeightGrams,
        totalFabricWeightKg
    };
}


/*
==================================================
MATERIALZUSAMMENSETZUNG
==================================================
*/

function renderMaterialComposition(productId) {

    const container =
        document.getElementById(
            "materialComposition"
        );


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !product ||
        !product.materialComposition ||
        product.materialComposition.length === 0
    ) {

        container.textContent =
            "Keine Materialdaten vorhanden.";

        return;
    }


    product.materialComposition.forEach(
        composition => {

            const material =
                materials.find(
                    item =>
                        item.id ===
                        composition.materialId
                );


            const paragraph =
                document.createElement("p");


            paragraph.textContent =
                `${composition.percentage} % ${
                    material
                        ? material.name
                        : composition.materialId
                }`;


            container.appendChild(
                paragraph
            );
        }
    );
}


/*
==================================================
WEITERE PRODUKTBESTANDTEILE
==================================================
*/

function renderProductComponents(productId) {

    const container =
        document.getElementById(
            "productComponents"
        );


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !product ||
        !product.components ||
        product.components.length === 0
    ) {

        container.textContent =
            "Keine weiteren Produktbestandteile hinterlegt.";

        return;
    }


    product.components.forEach(
        productComponent => {

            const component =
                components.find(
                    item =>
                        item.id ===
                        productComponent.componentId
                );


            if (!component) {
                return;
            }


            const paragraph =
                document.createElement("p");


            paragraph.textContent =
                `${component.name}: ${productComponent.quantity} ${component.unit}`;


            container.appendChild(
                paragraph
            );
        }
    );
}


/*
==================================================
KOMPONENTENBILANZ
==================================================
*/

function calculateComponentBalance() {

    const container =
        document.getElementById(
            "componentCalculation"
        );


    const base =
        getProductCalculationBase();


    if (
        !container ||
        !base
    ) {

        return;
    }


    const product =
        base.product;


    container.innerHTML = "";


    let totalMassKg = 0;
    let totalCo2 = 0;
    let totalWater = 0;
    let totalEnergy = 0;


    if (
        !product.components ||
        product.components.length === 0
    ) {

        currentComponentTotals = {
            co2: 0,
            water: 0,
            energy: 0,
            massKg: 0
        };


        container.textContent =
            "Keine weiteren Komponenten vorhanden.";


        calculateOverallBalance();

        return;
    }


    product.components.forEach(
        productComponent => {

            const component =
                components.find(
                    item =>
                        item.id ===
                        productComponent.componentId
                );


            if (!component) {
                return;
            }


            const massGrams =
                Number(
                    productComponent.quantity
                );


            const massKg =
                massGrams / 1000;


            const co2 =
                massKg
                * component.co2KgPerKg;


            const water =
                massKg
                * component.waterLitersPerKg;


            const energy =
                massKg
                * component.energyKwhPerKg;


            totalMassKg += massKg;
            totalCo2 += co2;
            totalWater += water;
            totalEnergy += energy;


            const material =
                materials.find(
                    item =>
                        item.id ===
                        component.materialId
                );


            const section =
                document.createElement("div");


            section.style.marginBottom =
                "20px";


            section.innerHTML = `
                <h3>
                    ${component.name}
                </h3>

                <p>
                    Kategorie:
                    ${component.category}
                </p>

                <p>
                    Material:
                    ${
                        material
                            ? material.name
                            : component.materialId
                    }
                </p>

                <p>
                    Masse:
                    ${massGrams.toFixed(1)}
                    g
                </p>

                <p>
                    CO₂:
                    ${co2.toFixed(3)}
                    kg CO₂e
                </p>

                <p>
                    Wasser:
                    ${water.toFixed(2)}
                    L
                </p>

                <p>
                    Energie:
                    ${energy.toFixed(3)}
                    kWh
                </p>
            `;


            container.appendChild(
                section
            );
        }
    );


    currentComponentTotals = {
        co2: totalCo2,
        water: totalWater,
        energy: totalEnergy,
        massKg: totalMassKg
    };


    const totals =
        document.createElement("div");


    totals.style.marginTop =
        "30px";


    totals.innerHTML = `
        <h3>
            Gesamt – weitere Produktbestandteile
        </h3>

        <p>
            <strong>Masse:</strong>
            ${(totalMassKg * 1000).toFixed(1)}
            g
        </p>

        <p>
            <strong>CO₂:</strong>
            ${totalCo2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            <strong>Wasser:</strong>
            ${totalWater.toFixed(2)}
            L
        </p>

        <p>
            <strong>Energie:</strong>
            ${totalEnergy.toFixed(3)}
            kWh
        </p>
    `;


    container.appendChild(
        totals
    );


    calculateOverallBalance();
}


/*
==================================================
VERPACKUNG ANZEIGEN
==================================================
*/

function renderPackaging(productId) {

    const container =
        document.getElementById(
            "packaging"
        );


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !product ||
        !product.packaging ||
        product.packaging.length === 0
    ) {

        container.textContent =
            "Keine Verpackungsdaten hinterlegt.";

        return;
    }


    product.packaging.forEach(
        productPackaging => {

            const packagingMaterial =
                packagingMaterials.find(
                    item =>
                        item.id ===
                        productPackaging.packagingMaterialId
                );


            if (!packagingMaterial) {
                return;
            }


            const section =
                document.createElement("div");


            section.style.marginBottom =
                "20px";


            section.innerHTML = `
                <h3>
                    ${packagingMaterial.name}
                </h3>

                <p>
                    Material:
                    ${packagingMaterial.material}
                </p>

                <p>
                    Masse:
                    ${productPackaging.quantityGrams}
                    g
                </p>

                <p>
                    Recyclinganteil:
                    ${packagingMaterial.recycledContent}
                    %
                </p>

                <p>
                    Recycelbar:
                    ${
                        packagingMaterial.recyclable
                            ? "Ja"
                            : "Nein"
                    }
                </p>
            `;


            container.appendChild(
                section
            );
        }
    );
}


/*
==================================================
VERPACKUNGSBILANZ
==================================================
*/

function calculatePackagingBalance() {

    const container =
        document.getElementById(
            "packagingCalculation"
        );


    const base =
        getProductCalculationBase();


    if (
        !container ||
        !base
    ) {

        return;
    }


    const product =
        base.product;


    container.innerHTML = "";


    let totalMassKg = 0;
    let totalCo2 = 0;
    let totalWater = 0;
    let totalEnergy = 0;


    if (
        !product.packaging ||
        product.packaging.length === 0
    ) {

        currentPackagingTotals = {
            co2: 0,
            water: 0,
            energy: 0,
            massKg: 0
        };


        container.textContent =
            "Keine Verpackung vorhanden.";


        calculateOverallBalance();

        return;
    }


    product.packaging.forEach(
        productPackaging => {

            const packagingMaterial =
                packagingMaterials.find(
                    item =>
                        item.id ===
                        productPackaging.packagingMaterialId
                );


            if (!packagingMaterial) {
                return;
            }


            const massGrams =
                Number(
                    productPackaging.quantityGrams
                );


            const massKg =
                massGrams / 1000;


            const co2 =
                massKg
                * packagingMaterial.co2KgPerKg;


            const water =
                massKg
                * packagingMaterial.waterLitersPerKg;


            const energy =
                massKg
                * packagingMaterial.energyKwhPerKg;


            totalMassKg += massKg;
            totalCo2 += co2;
            totalWater += water;
            totalEnergy += energy;


            const section =
                document.createElement("div");


            section.style.marginBottom =
                "20px";


            section.innerHTML = `
                <h3>
                    ${packagingMaterial.name}
                </h3>

                <p>
                    Masse:
                    ${massGrams.toFixed(1)}
                    g
                </p>

                <p>
                    CO₂:
                    ${co2.toFixed(3)}
                    kg CO₂e
                </p>

                <p>
                    Wasser:
                    ${water.toFixed(2)}
                    L
                </p>

                <p>
                    Energie:
                    ${energy.toFixed(3)}
                    kWh
                </p>
            `;


            container.appendChild(
                section
            );
        }
    );


    currentPackagingTotals = {
        co2: totalCo2,
        water: totalWater,
        energy: totalEnergy,
        massKg: totalMassKg
    };


    const totals =
        document.createElement("div");


    totals.style.marginTop =
        "30px";


    totals.innerHTML = `
        <h3>
            Gesamt – Verpackung
        </h3>

        <p>
            <strong>Verpackungsgewicht:</strong>
            ${(totalMassKg * 1000).toFixed(1)}
            g
        </p>

        <p>
            <strong>CO₂:</strong>
            ${totalCo2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            <strong>Wasser:</strong>
            ${totalWater.toFixed(2)}
            L
        </p>

        <p>
            <strong>Energie:</strong>
            ${totalEnergy.toFixed(3)}
            kWh
        </p>
    `;


    container.appendChild(
        totals
    );


    calculateOverallBalance();
}


/*
==================================================
PFLEGEHINWEISE
==================================================
*/

function renderCareInformation(productId) {

    const container =
        document.getElementById(
            "careInformation"
        );


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !product ||
        !product.careProfileId
    ) {

        container.textContent =
            "Keine Pflegehinweise hinterlegt.";

        return;
    }


    const careProfile =
        careProfiles.find(
            item =>
                item.id ===
                product.careProfileId
        );


    if (!careProfile) {

        container.textContent =
            `Pflegeprofil "${product.careProfileId}" wurde nicht gefunden.`;

        return;
    }


    const washingText =
        careProfile.washingAllowed
            ? `${careProfile.washingTemperatureC} °C`
            : "Nicht waschen";


    const bleachingText =
        careProfile.bleachingAllowed
            ? "Erlaubt"
            : "Nicht erlaubt";


    const tumbleDryingText =
        careProfile.tumbleDryingAllowed
            ? "Erlaubt"
            : "Nicht empfohlen";


    const ironingText =
        careProfile.ironingAllowed
            ? `Ja, Temperatur: ${careProfile.ironingTemperature}`
            : "Nicht bügeln";


    const professionalCleaningText =
        careProfile.professionalCleaningAllowed
            ? "Erlaubt"
            : "Nicht erlaubt";


    const airDryingText =
        careProfile.airDryingRecommended
            ? "Empfohlen"
            : "Keine besondere Empfehlung";


    container.innerHTML = `
        <h3>
            ${careProfile.name}
        </h3>

        <p>
            <strong>Waschen:</strong>
            ${washingText}
        </p>

        <p>
            <strong>Bleichen:</strong>
            ${bleachingText}
        </p>

        <p>
            <strong>Wäschetrockner:</strong>
            ${tumbleDryingText}
        </p>

        <p>
            <strong>Lufttrocknung:</strong>
            ${airDryingText}
        </p>

        <p>
            <strong>Bügeln:</strong>
            ${ironingText}
        </p>

        <p>
            <strong>Professionelle Reinigung:</strong>
            ${professionalCleaningText}
        </p>

        <p>
            <strong>Pflegeempfehlung:</strong><br>
            ${careProfile.careText}
        </p>

        <p>
            <em>
                Eine sachgerechte Pflege kann
                die Nutzungsdauer des Produktes verlängern.
            </em>
        </p>
    `;
}


/*
==================================================
HALTBARKEIT UND QUALITÄT
==================================================
*/

function renderDurabilityInformation(
    productId
) {

    const container =
        document.getElementById(
            "durabilityInformation"
        );


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !product ||
        !product.durabilityProfileId
    ) {

        container.textContent =
            "Keine Haltbarkeitsdaten hinterlegt.";

        return;
    }


    const profile =
        durabilityProfiles.find(
            item =>
                item.id ===
                product.durabilityProfileId
        );


    if (!profile) {

        container.textContent =
            `Haltbarkeitsprofil "${product.durabilityProfileId}" wurde nicht gefunden.`;

        return;
    }


    container.innerHTML = `
        <h3>
            ${profile.name}
        </h3>

        <p>
            <strong>Abriebfestigkeit:</strong>
            ${profile.abrasionResistanceCycles.toLocaleString("de-DE")}
            Zyklen
        </p>

        <p>
            <strong>Farbechtheit:</strong>
            ${profile.colorFastnessRating} / 5
        </p>

        <p>
            <strong>Nahtfestigkeit:</strong>
            ${profile.seamStrengthRating}
        </p>

        <p>
            <strong>Maßänderung:</strong>
            ${profile.dimensionalChangePercent}
            %
        </p>

        <p>
            <strong>Qualitätshinweis:</strong>
            ${profile.qualityNote}
        </p>

        <p>
            <em>
                Die aktuell hinterlegten Prüfwerte
                sind Demonstrationsdaten.
            </em>
        </p>
    `;
}


/*
==================================================
REPARATUR
==================================================
*/

function renderRepairInformation(
    productId
) {

    const container =
        document.getElementById(
            "repairInformation"
        );


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !product ||
        !product.repairProfileId
    ) {

        container.textContent =
            "Keine Reparaturinformationen hinterlegt.";

        return;
    }


    const profile =
        repairProfiles.find(
            item =>
                item.id ===
                product.repairProfileId
        );


    if (!profile) {

        container.textContent =
            `Reparaturprofil "${product.repairProfileId}" wurde nicht gefunden.`;

        return;
    }


    function yesNo(value) {

        return value
            ? "Ja"
            : "Nein";
    }


    let instructions = "";


    if (
        Array.isArray(
            profile.repairInstructions
        )
    ) {

        instructions =
            profile.repairInstructions
                .map(
                    instruction =>
                        `<li>${instruction}</li>`
                )
                .join("");
    }


    container.innerHTML = `
        <h3>
            ${profile.name}
        </h3>

        <p>
            <strong>
                Grundsätzlich reparierbar:
            </strong>
            ${yesNo(profile.repairable)}
        </p>

        <p>
            <strong>
                Knöpfe austauschbar:
            </strong>
            ${yesNo(profile.replaceableButtons)}
        </p>

        <p>
            <strong>
                Nähte reparierbar:
            </strong>
            ${yesNo(profile.seamsRepairable)}
        </p>

        <p>
            <strong>
                Kragen reparierbar:
            </strong>
            ${yesNo(profile.collarRepairable)}
        </p>

        <p>
            <strong>
                Manschetten reparierbar:
            </strong>
            ${yesNo(profile.cuffsRepairable)}
        </p>

        <p>
            <strong>
                Ersatzknopf enthalten:
            </strong>
            ${yesNo(profile.spareButtonIncluded)}
        </p>

        <p>
            <strong>
                Reparaturaufwand:
            </strong>
            ${profile.repairDifficulty}
        </p>

        <h4>
            Reparaturhinweise
        </h4>

        <ul>
            ${instructions}
        </ul>

        <p>
            <em>
                Reparaturen können die Nutzungsdauer
                verlängern und einen vorzeitigen
                Ersatz vermeiden.
            </em>
        </p>
    `;
}


/*
==================================================
WIEDERVERWENDUNG UND RECYCLING
==================================================
*/

function renderCircularityInformation(
    productId
) {

    const container =
        document.getElementById(
            "circularityInformation"
        );


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !product ||
        !product.circularityProfileId
    ) {

        container.textContent =
            "Keine Kreislaufinformationen hinterlegt.";

        return;
    }


    const profile =
        circularityProfiles.find(
            item =>
                item.id ===
                product.circularityProfileId
        );


    if (!profile) {

        container.textContent =
            `Kreislaufprofil "${product.circularityProfileId}" wurde nicht gefunden.`;

        return;
    }


    function yesNo(value) {

        return value
            ? "Ja"
            : "Nein";
    }


    let instructions = "";


    if (
        Array.isArray(
            profile.endOfLifeInstructions
        )
    ) {

        instructions =
            profile.endOfLifeInstructions
                .map(
                    instruction =>
                        `<li>${instruction}</li>`
                )
                .join("");
    }


    let preferredOrder = "";


    if (
        Array.isArray(
            profile.preferredEndOfLifeOrder
        )
    ) {

        preferredOrder =
            profile.preferredEndOfLifeOrder
                .map(
                    item =>
                        `<li>${item}</li>`
                )
                .join("");
    }


    container.innerHTML = `
        <h3>
            ${profile.name}
        </h3>

        <p>
            <strong>
                Wiederverwendbar:
            </strong>
            ${yesNo(profile.reusable)}
        </p>

        <p>
            <strong>
                Für Second Hand geeignet:
            </strong>
            ${yesNo(profile.secondHandSuitable)}
        </p>

        <p>
            <strong>
                Für Weitergabe / Spende geeignet:
            </strong>
            ${yesNo(profile.donationSuitable)}
        </p>

        <p>
            <strong>
                Materialtrennung empfohlen:
            </strong>
            ${yesNo(profile.materialSeparationRecommended)}
        </p>

        <p>
            <strong>
                Knöpfe entfernbar:
            </strong>
            ${yesNo(profile.buttonsRemovable)}
        </p>

        <p>
            <strong>
                Labels entfernbar:
            </strong>
            ${yesNo(profile.labelsRemovable)}
        </p>

        <p>
            <strong>
                Recyclingpotenzial:
            </strong>
            ${profile.recyclingPotential}
        </p>

        <p>
            <strong>
                Begründung:
            </strong>
            ${profile.recyclingReason}
        </p>


        <h4>
            Hinweise zum Lebensende
        </h4>

        <ul>
            ${instructions}
        </ul>


        <h4>
            Empfohlene Reihenfolge
        </h4>

        <ol>
            ${preferredOrder}
        </ol>

        <p>
            <em>
                Weiterverwendung und Reparatur
                sollten nach Möglichkeit vor
                der stofflichen Verwertung stehen.
            </em>
        </p>
    `;
}


/*
==================================================
ROHSTOFFQUELLEN
==================================================
*/

function renderMaterialSources(productId) {

    const container =
        document.getElementById(
            "materialSources"
        );


    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !product ||
        !product.materialComposition ||
        product.materialComposition.length === 0
    ) {

        container.textContent =
            "Keine Materialien vorhanden.";

        return;
    }


    product.materialComposition.forEach(
        composition => {

            const material =
                materials.find(
                    item =>
                        item.id ===
                        composition.materialId
                );


            const matchingSources =
                materialSources.filter(
                    source =>
                        source.materialId ===
                        composition.materialId
                );


            const section =
                document.createElement("div");


            section.style.marginBottom =
                "25px";


            const heading =
                document.createElement("h3");


            heading.textContent =
                `${composition.percentage} % ${
                    material
                        ? material.name
                        : composition.materialId
                }`;


            section.appendChild(
                heading
            );


            const label =
                document.createElement("label");


            label.textContent =
                "Rohstoffquelle / Lieferant:";


            section.appendChild(
                label
            );


            section.appendChild(
                document.createElement(
                    "br"
                )
            );


            const select =
                document.createElement(
                    "select"
                );


            select.id =
                `material-source-${composition.materialId}`;


            if (
                matchingSources.length === 0
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value = "";


                option.textContent =
                    "Keine Rohstoffquelle verfügbar";


                select.appendChild(
                    option
                );

            } else {

                matchingSources.forEach(
                    source => {

                        const company =
                            companies.find(
                                item =>
                                    item.id ===
                                    source.companyId
                            );


                        const site =
                            sites.find(
                                item =>
                                    item.id ===
                                    source.siteId
                            );


                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            source.id;


                        let text =
                            company
                                ? company.name
                                : source.name;


                        if (site) {

                            text +=
                                ` – ${site.city}, ${site.country}`;
                        }


                        option.textContent =
                            text;


                        select.appendChild(
                            option
                        );
                    }
                );
            }


            section.appendChild(
                select
            );


            const info =
                document.createElement(
                    "div"
                );


            info.id =
                `material-source-info-${composition.materialId}`;


            info.style.marginTop =
                "10px";


            section.appendChild(
                info
            );


            select.addEventListener(
                "change",
                () => {

                    updateMaterialSourceInfo(
                        composition.materialId
                    );


                    calculateRawMaterialBalance();

                    calculateProductionBalance();

                    calculateTransportBalance();

                    calculateOverallBalance();
                }
            );


            container.appendChild(
                section
            );


            if (
                matchingSources.length > 0
            ) {

                updateMaterialSourceInfo(
                    composition.materialId
                );
            }
        }
    );


    calculateRawMaterialBalance();
}


/*
==================================================
ROHSTOFFQUELLEN-INFOS
==================================================
*/

function updateMaterialSourceInfo(
    materialId
) {

    const select =
        document.getElementById(
            `material-source-${materialId}`
        );


    const info =
        document.getElementById(
            `material-source-info-${materialId}`
        );


    if (
        !select ||
        !info
    ) {

        return;
    }


    const source =
        materialSources.find(
            item =>
                item.id ===
                select.value
        );


    if (!source) {

        info.textContent =
            "Keine Daten vorhanden.";

        return;
    }


    info.innerHTML = `
        <p>
            Herkunft:
            ${source.originRegion},
            ${source.originCountry}
        </p>

        <p>
            CO₂-Faktor:
            ${source.co2KgPerKg}
            kg CO₂e/kg
        </p>

        <p>
            Wasserverbrauch:
            ${source.waterLitersPerKg}
            L/kg
        </p>

        <p>
            Energieverbrauch:
            ${source.energyKwhPerKg}
            kWh/kg
        </p>

        <p>
            Recyclinganteil:
            ${source.recycledContent}
            %
        </p>
    `;
}


/*
==================================================
ROHSTOFFBILANZ
==================================================
*/

function calculateRawMaterialBalance() {

    const container =
        document.getElementById(
            "rawMaterialCalculation"
        );


    const base =
        getProductCalculationBase();


    if (
        !container ||
        !base
    ) {

        return;
    }


    const {
        product,
        fabricArea,
        totalFabricWeightGrams,
        totalFabricWeightKg
    } = base;


    let totalCo2 = 0;
    let totalWater = 0;
    let totalEnergy = 0;


    container.innerHTML = `
        <p>
            <strong>
                Berechneter Stoffbedarf:
            </strong>
            ${fabricArea.toFixed(3)}
            m²
        </p>

        <p>
            <strong>
                Flächengewicht:
            </strong>
            ${product.fabricWeight}
            g/m²
        </p>

        <p>
            <strong>
                Hauptstoffmasse:
            </strong>
            ${totalFabricWeightGrams.toFixed(1)}
            g
        </p>
    `;


    product.materialComposition.forEach(
        composition => {

            const material =
                materials.find(
                    item =>
                        item.id ===
                        composition.materialId
                );


            const sourceSelect =
                document.getElementById(
                    `material-source-${composition.materialId}`
                );


            if (!sourceSelect) {
                return;
            }


            const source =
                materialSources.find(
                    item =>
                        item.id ===
                        sourceSelect.value
                );


            if (!source) {
                return;
            }


            const materialWeightKg =
                totalFabricWeightKg
                * (
                    composition.percentage
                    / 100
                );


            const materialWeightGrams =
                materialWeightKg
                * 1000;


            const co2 =
                materialWeightKg
                * source.co2KgPerKg;


            const water =
                materialWeightKg
                * source.waterLitersPerKg;


            const energy =
                materialWeightKg
                * source.energyKwhPerKg;


            totalCo2 += co2;
            totalWater += water;
            totalEnergy += energy;


            const section =
                document.createElement(
                    "div"
                );


            section.style.marginTop =
                "20px";


            section.innerHTML = `
                <h3>
                    ${
                        material
                            ? material.name
                            : composition.materialId
                    }
                </h3>

                <p>
                    Materialanteil:
                    ${composition.percentage}
                    %
                </p>

                <p>
                    Materialmenge:
                    ${materialWeightGrams.toFixed(1)}
                    g
                </p>

                <p>
                    CO₂:
                    ${co2.toFixed(3)}
                    kg CO₂e
                </p>

                <p>
                    Wasser:
                    ${water.toFixed(1)}
                    L
                </p>

                <p>
                    Energie:
                    ${energy.toFixed(3)}
                    kWh
                </p>
            `;


            container.appendChild(
                section
            );
        }
    );


    currentRawTotals = {
        co2: totalCo2,
        water: totalWater,
        energy: totalEnergy
    };


    const totals =
        document.createElement(
            "div"
        );


    totals.style.marginTop =
        "30px";


    totals.innerHTML = `
        <h3>
            Gesamt – Rohstoffphase
        </h3>

        <p>
            <strong>CO₂:</strong>
            ${totalCo2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            <strong>Wasser:</strong>
            ${totalWater.toFixed(1)}
            L
        </p>

        <p>
            <strong>Energie:</strong>
            ${totalEnergy.toFixed(3)}
            kWh
        </p>
    `;


    container.appendChild(
        totals
    );


    calculateOverallBalance();
}


/*
==================================================
PROZESSKETTE
==================================================
*/

function renderProcessChain(productId) {

    const container =
        document.getElementById(
            "processChain"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const chain =
        processChains.find(
            item =>
                item.productId ===
                productId
        );


    if (!chain) {

        container.textContent =
            "Keine Prozesskette vorhanden.";

        return;
    }


    chain.steps.forEach(
        (step, index) => {

            const process =
                processes.find(
                    item =>
                        item.id ===
                        step.processType
                );


            const material =
                step.materialId
                    ? materials.find(
                        item =>
                            item.id ===
                            step.materialId
                    )
                    : null;


            const paragraph =
                document.createElement(
                    "p"
                );


            let text =
                `${index + 1}. ${
                    process
                        ? process.name
                        : step.processType
                }`;


            if (material) {

                text +=
                    ` – ${material.name}`;
            }


            if (
                step.branch === "cotton"
            ) {

                text +=
                    " [Baumwollkette]";
            }


            if (
                step.branch ===
                "polyester"
            ) {

                text +=
                    " [Polyesterkette]";
            }


            paragraph.textContent =
                text;


            container.appendChild(
                paragraph
            );
        }
    );
}


/*
==================================================
ABTEILUNGSFILTER
==================================================
*/

function departmentSupportsMaterial(
    department,
    materialId
) {

    if (!materialId) {
        return true;
    }


    if (
        !department.supportedMaterials ||
        department.supportedMaterials.length === 0
    ) {

        return false;
    }


    return (
        department.supportedMaterials
            .includes(materialId)
    );
}


function getMatchingDepartments(
    processType,
    materialId = null
) {

    return departments.filter(
        department => {

            return (
                department.processType ===
                    processType
                &&
                departmentSupportsMaterial(
                    department,
                    materialId
                )
            );
        }
    );
}


function getCompaniesForProcess(
    processType,
    materialId = null
) {

    const matchingDepartments =
        getMatchingDepartments(
            processType,
            materialId
        );


    const matchingSiteIds = [
        ...new Set(
            matchingDepartments.map(
                department =>
                    department.siteId
            )
        )
    ];


    const matchingCompanyIds = [
        ...new Set(
            sites
                .filter(
                    site =>
                        matchingSiteIds
                            .includes(
                                site.id
                            )
                )
                .map(
                    site =>
                        site.companyId
                )
        )
    ];


    return companies.filter(
        company =>
            matchingCompanyIds
                .includes(
                    company.id
                )
    );
}


function getSitesForProcess(
    companyId,
    processType,
    materialId = null
) {

    const matchingDepartments =
        getMatchingDepartments(
            processType,
            materialId
        );


    const matchingSiteIds = [
        ...new Set(
            matchingDepartments.map(
                department =>
                    department.siteId
            )
        )
    ];


    return sites.filter(
        site =>
            site.companyId ===
                companyId
            &&
            matchingSiteIds
                .includes(
                    site.id
                )
    );
}


function getDepartmentsForProcess(
    siteId,
    processType,
    materialId = null
) {

    return getMatchingDepartments(
        processType,
        materialId
    ).filter(
        department =>
            department.siteId ===
            siteId
    );
}


/*
==================================================
PROZESS-DROPDOWNS
==================================================
*/

function updateProcessSiteSelect(
    stepId,
    processType,
    materialId
) {

    const companySelect =
        document.getElementById(
            `company-${stepId}`
        );


    const siteSelect =
        document.getElementById(
            `site-${stepId}`
        );


    const departmentSelect =
        document.getElementById(
            `department-${stepId}`
        );


    if (
        !companySelect ||
        !siteSelect ||
        !departmentSelect
    ) {

        return;
    }


    const matchingSites =
        getSitesForProcess(
            companySelect.value,
            processType,
            materialId
        );


    siteSelect.innerHTML = "";


    if (
        matchingSites.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value = "";


        option.textContent =
            "Kein passender Standort";


        siteSelect.appendChild(
            option
        );


        departmentSelect.innerHTML =
            "";


        return;
    }


    matchingSites.forEach(
        site => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                site.id;


            option.textContent =
                `${site.name} – ${site.city}`;


            siteSelect.appendChild(
                option
            );
        }
    );


    updateProcessDepartmentSelect(
        stepId,
        processType,
        materialId
    );
}


function updateProcessDepartmentSelect(
    stepId,
    processType,
    materialId
) {

    const siteSelect =
        document.getElementById(
            `site-${stepId}`
        );


    const departmentSelect =
        document.getElementById(
            `department-${stepId}`
        );


    if (
        !siteSelect ||
        !departmentSelect
    ) {

        return;
    }


    const matchingDepartments =
        getDepartmentsForProcess(
            siteSelect.value,
            processType,
            materialId
        );


    departmentSelect.innerHTML =
        "";


    if (
        matchingDepartments.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value = "";


        option.textContent =
            "Keine passende Abteilung";


        departmentSelect.appendChild(
            option
        );


        return;
    }


    matchingDepartments.forEach(
        department => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                department.id;


            option.textContent =
                department.name;


            departmentSelect.appendChild(
                option
            );
        }
    );
}


/*
==================================================
PRODUKTIONSZUORDNUNG
==================================================
*/

function renderProcessAssignments(
    productId
) {

    const container =
        document.getElementById(
            "processAssignments"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const chain =
        processChains.find(
            item =>
                item.productId ===
                productId
        );


    if (!chain) {

        container.textContent =
            "Keine Prozesskette vorhanden.";

        return;
    }


    chain.steps.forEach(
        (step, index) => {

            const process =
                processes.find(
                    item =>
                        item.id ===
                        step.processType
                );


            const material =
                step.materialId
                    ? materials.find(
                        item =>
                            item.id ===
                            step.materialId
                    )
                    : null;


            const section =
                document.createElement(
                    "div"
                );


            section.style.marginBottom =
                "30px";


            const heading =
                document.createElement(
                    "h3"
                );


            let headingText =
                `${index + 1}. ${
                    process
                        ? process.name
                        : step.processType
                }`;


            if (material) {

                headingText +=
                    ` – ${material.name}`;
            }


            heading.textContent =
                headingText;


            section.appendChild(
                heading
            );


            if (
                step.processType ===
                    "cotton-processing"
                ||
                step.processType ===
                    "polyester-production"
            ) {

                const info =
                    document.createElement(
                        "p"
                    );


                info.textContent =
                    "Standort wird automatisch aus der gewählten Rohstoffquelle übernommen.";


                section.appendChild(
                    info
                );


                container.appendChild(
                    section
                );


                return;
            }


            const matchingCompanies =
                getCompaniesForProcess(
                    step.processType,
                    step.materialId ||
                        null
                );


            const companyLabel =
                document.createElement(
                    "label"
                );


            companyLabel.textContent =
                "Unternehmen:";


            const companySelect =
                document.createElement(
                    "select"
                );


            companySelect.id =
                `company-${step.id}`;


            matchingCompanies.forEach(
                company => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        company.id;


                    option.textContent =
                        company.name;


                    companySelect.appendChild(
                        option
                    );
                }
            );


            section.appendChild(
                companyLabel
            );


            section.appendChild(
                document.createElement(
                    "br"
                )
            );


            section.appendChild(
                companySelect
            );


            section.appendChild(
                document.createElement(
                    "br"
                )
            );


            section.appendChild(
                document.createElement(
                    "br"
                )
            );


            const siteLabel =
                document.createElement(
                    "label"
                );


            siteLabel.textContent =
                "Standort:";


            const siteSelect =
                document.createElement(
                    "select"
                );


            siteSelect.id =
                `site-${step.id}`;


            section.appendChild(
                siteLabel
            );


            section.appendChild(
                document.createElement(
                    "br"
                )
            );


            section.appendChild(
                siteSelect
            );


            section.appendChild(
                document.createElement(
                    "br"
                )
            );


            section.appendChild(
                document.createElement(
                    "br"
                )
            );


            const departmentLabel =
                document.createElement(
                    "label"
                );


            departmentLabel.textContent =
                "Abteilung:";


            const departmentSelect =
                document.createElement(
                    "select"
                );


            departmentSelect.id =
                `department-${step.id}`;


            section.appendChild(
                departmentLabel
            );


            section.appendChild(
                document.createElement(
                    "br"
                )
            );


            section.appendChild(
                departmentSelect
            );


            container.appendChild(
                section
            );


            companySelect.addEventListener(
                "change",
                () => {

                    updateProcessSiteSelect(
                        step.id,
                        step.processType,
                        step.materialId ||
                            null
                    );


                    calculateProductionBalance();

                    calculateTransportBalance();
                }
            );


            siteSelect.addEventListener(
                "change",
                () => {

                    updateProcessDepartmentSelect(
                        step.id,
                        step.processType,
                        step.materialId ||
                            null
                    );


                    calculateProductionBalance();

                    calculateTransportBalance();
                }
            );


            departmentSelect.addEventListener(
                "change",
                () => {

                    calculateProductionBalance();

                    calculateTransportBalance();
                }
            );


            if (
                matchingCompanies.length > 0
            ) {

                updateProcessSiteSelect(
                    step.id,
                    step.processType,
                    step.materialId ||
                        null
                );
            }
        }
    );


    calculateProductionBalance();

    calculateTransportBalance();
}


/*
==================================================
PRODUKTIONSBILANZ
==================================================
*/

function calculateProductionBalance() {

    const container =
        document.getElementById(
            "productionCalculation"
        );


    const base =
        getProductCalculationBase();


    if (
        !container ||
        !base
    ) {

        return;
    }


    const {
        product,
        totalFabricWeightKg
    } = base;


    const chain =
        processChains.find(
            item =>
                item.productId ===
                product.id
        );


    if (!chain) {
        return;
    }


    container.innerHTML = "";


    let totalEnergy = 0;
    let totalWater = 0;
    let totalCo2 = 0;


    chain.steps.forEach(
        step => {

            if (
                step.processType ===
                    "cotton-processing"
                ||
                step.processType ===
                    "polyester-production"
            ) {

                return;
            }


            const departmentSelect =
                document.getElementById(
                    `department-${step.id}`
                );


            if (
                !departmentSelect ||
                !departmentSelect.value
            ) {

                return;
            }


            const department =
                departments.find(
                    item =>
                        item.id ===
                        departmentSelect.value
                );


            if (!department) {
                return;
            }


            const site =
                sites.find(
                    item =>
                        item.id ===
                        department.siteId
                );


            if (!site) {
                return;
            }


            const environmental =
                siteEnvironmental.find(
                    item =>
                        item.siteId ===
                        site.id
                );


            if (!environmental) {
                return;
            }


            const processDataset =
                processData.find(
                    item => {

                        const departmentMatches =
                            item.departmentId ===
                            department.id;


                        const processMatches =
                            item.processType ===
                            step.processType;


                        const materialMatches =
                            step.materialId
                                ? item.materialId ===
                                    step.materialId
                                : !item.materialId;


                        return (
                            departmentMatches &&
                            processMatches &&
                            materialMatches
                        );
                    }
                );


            if (!processDataset) {

                const warning =
                    document.createElement(
                        "p"
                    );


                warning.textContent =
                    `Keine Prozessdaten für ${department.name} vorhanden.`;


                container.appendChild(
                    warning
                );


                return;
            }


            let processedMassKg =
                totalFabricWeightKg;


            if (step.materialId) {

                const composition =
                    product.materialComposition
                        .find(
                            item =>
                                item.materialId ===
                                step.materialId
                        );


                if (composition) {

                    processedMassKg =
                        totalFabricWeightKg
                        * (
                            composition.percentage
                            / 100
                        );
                }
            }


            const energy =
                processedMassKg
                * processDataset
                    .energyKwhPerKg;


            const water =
                processedMassKg
                * processDataset
                    .waterLitersPerKg;


            const electricityCo2 =
                energy
                * environmental
                    .electricityCo2KgPerKwh;


            const directCo2 =
                processedMassKg
                * processDataset
                    .directCo2KgPerKg;


            const co2 =
                electricityCo2
                + directCo2;


            totalEnergy += energy;
            totalWater += water;
            totalCo2 += co2;


            const processDefinition =
                processes.find(
                    item =>
                        item.id ===
                        step.processType
                );


            let title =
                processDefinition
                    ? processDefinition.name
                    : step.processType;


            if (step.materialId) {

                const material =
                    materials.find(
                        item =>
                            item.id ===
                            step.materialId
                    );


                if (material) {

                    title +=
                        ` – ${material.name}`;
                }
            }


            const section =
                document.createElement(
                    "div"
                );


            section.style.marginBottom =
                "25px";


            section.innerHTML = `
                <h3>
                    ${title}
                </h3>

                <p>
                    Standort:
                    ${site.name},
                    ${site.city}
                </p>

                <p>
                    Abteilung:
                    ${department.name}
                </p>

                <p>
                    Verarbeitete Masse:
                    ${(processedMassKg * 1000).toFixed(1)}
                    g
                </p>

                <p>
                    Energie:
                    ${energy.toFixed(3)}
                    kWh
                </p>

                <p>
                    Wasser:
                    ${water.toFixed(2)}
                    L
                </p>

                <p>
                    CO₂:
                    ${co2.toFixed(3)}
                    kg CO₂e
                </p>
            `;


            container.appendChild(
                section
            );
        }
    );


    currentProductionTotals = {
        co2: totalCo2,
        water: totalWater,
        energy: totalEnergy
    };


    const totals =
        document.createElement(
            "div"
        );


    totals.style.marginTop =
        "30px";


    totals.innerHTML = `
        <h3>
            Gesamt – Produktion
        </h3>

        <p>
            <strong>CO₂:</strong>
            ${totalCo2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            <strong>Wasser:</strong>
            ${totalWater.toFixed(2)}
            L
        </p>

        <p>
            <strong>Energie:</strong>
            ${totalEnergy.toFixed(3)}
            kWh
        </p>
    `;


    container.appendChild(
        totals
    );


    calculateOverallBalance();
}


/*
==================================================
TRANSPORT-HILFSFUNKTIONEN
==================================================
*/

function getSelectedMaterialSource(
    materialId
) {

    const select =
        document.getElementById(
            `material-source-${materialId}`
        );


    if (!select) {
        return null;
    }


    return (
        materialSources.find(
            item =>
                item.id ===
                select.value
        ) || null
    );
}


function getStepSiteId(step) {

    if (
        step.processType ===
            "cotton-processing"
        ||
        step.processType ===
            "polyester-production"
    ) {

        if (!step.materialId) {
            return null;
        }


        const source =
            getSelectedMaterialSource(
                step.materialId
            );


        return source
            ? source.siteId
            : null;
    }


    const siteSelect =
        document.getElementById(
            `site-${step.id}`
        );


    return siteSelect
        ? siteSelect.value
        : null;
}


function getTransportMassKg(
    fromStep,
    product,
    totalFabricWeightKg
) {

    if (fromStep.materialId) {

        const composition =
            product.materialComposition.find(
                item =>
                    item.materialId ===
                    fromStep.materialId
            );


        if (composition) {

            return (
                totalFabricWeightKg
                * (
                    composition.percentage
                    / 100
                )
            );
        }
    }


    return totalFabricWeightKg;
}


function findTransportRoute(
    fromSiteId,
    toSiteId
) {

    let route =
        transportRoutes.find(
            item =>
                item.fromSiteId ===
                    fromSiteId
                &&
                item.toSiteId ===
                    toSiteId
        );


    if (route) {
        return route;
    }


    route =
        transportRoutes.find(
            item =>
                item.fromSiteId ===
                    toSiteId
                &&
                item.toSiteId ===
                    fromSiteId
        );


    return route || null;
}


function getStepLabel(step) {

    const process =
        processes.find(
            item =>
                item.id ===
                step.processType
        );


    let text =
        process
            ? process.name
            : step.processType;


    if (step.materialId) {

        const material =
            materials.find(
                item =>
                    item.id ===
                    step.materialId
            );


        if (material) {

            text +=
                ` – ${material.name}`;
        }
    }


    return text;
}


/*
==================================================
TRANSPORTBILANZ
==================================================
*/

function calculateTransportBalance() {

    const container =
        document.getElementById(
            "transportCalculation"
        );


    const base =
        getProductCalculationBase();


    if (
        !container ||
        !base
    ) {

        return;
    }


    const {
        product,
        totalFabricWeightKg
    } = base;


    const chain =
        processChains.find(
            item =>
                item.productId ===
                product.id
        );


    if (!chain) {
        return;
    }


    container.innerHTML = "";


    let totalCo2 = 0;
    let totalEnergy = 0;
    let transportNumber = 1;


    chain.steps.forEach(
        currentStep => {

            if (
                !currentStep.previousSteps ||
                currentStep.previousSteps.length === 0
            ) {

                return;
            }


            currentStep.previousSteps.forEach(
                previousStepId => {

                    const previousStep =
                        chain.steps.find(
                            item =>
                                item.id ===
                                previousStepId
                        );


                    if (!previousStep) {
                        return;
                    }


                    const fromSiteId =
                        getStepSiteId(
                            previousStep
                        );


                    const toSiteId =
                        getStepSiteId(
                            currentStep
                        );


                    if (
                        !fromSiteId ||
                        !toSiteId
                    ) {

                        return;
                    }


                    const fromSite =
                        sites.find(
                            item =>
                                item.id ===
                                fromSiteId
                        );


                    const toSite =
                        sites.find(
                            item =>
                                item.id ===
                                toSiteId
                        );


                    if (
                        !fromSite ||
                        !toSite
                    ) {

                        return;
                    }


                    const massKg =
                        getTransportMassKg(
                            previousStep,
                            product,
                            totalFabricWeightKg
                        );


                    const section =
                        document.createElement(
                            "div"
                        );


                    section.style.marginBottom =
                        "25px";


                    if (
                        fromSiteId ===
                        toSiteId
                    ) {

                        section.innerHTML = `
                            <h3>
                                Verbindung ${transportNumber}
                            </h3>

                            <p>
                                ${getStepLabel(previousStep)}
                                →
                                ${getStepLabel(currentStep)}
                            </p>

                            <p>
                                Standort:
                                ${fromSite.name}
                            </p>

                            <p>
                                <strong>
                                    Kein externer Transport erforderlich.
                                </strong>
                            </p>
                        `;


                        container.appendChild(
                            section
                        );


                        transportNumber++;


                        return;
                    }


                    const route =
                        findTransportRoute(
                            fromSiteId,
                            toSiteId
                        );


                    if (!route) {

                        section.innerHTML = `
                            <h3>
                                Verbindung ${transportNumber}
                            </h3>

                            <p>
                                ${getStepLabel(previousStep)}
                                →
                                ${getStepLabel(currentStep)}
                            </p>

                            <p>
                                ${fromSite.name}
                                →
                                ${toSite.name}
                            </p>

                            <p>
                                <strong>
                                    ⚠ Keine Transportroute hinterlegt.
                                </strong>
                            </p>
                        `;


                        container.appendChild(
                            section
                        );


                        transportNumber++;


                        return;
                    }


                    const mode =
                        transportModes.find(
                            item =>
                                item.id ===
                                route.defaultTransportModeId
                        );


                    if (!mode) {
                        return;
                    }


                    const massTonnes =
                        massKg / 1000;


                    const tonneKilometres =
                        massTonnes
                        * route.distanceKm;


                    const co2 =
                        tonneKilometres
                        * mode.co2KgPerTonneKm;


                    const energy =
                        tonneKilometres
                        * mode.energyKwhPerTonneKm;


                    totalCo2 += co2;
                    totalEnergy += energy;


                    section.innerHTML = `
                        <h3>
                            Transport ${transportNumber}
                        </h3>

                        <p>
                            ${getStepLabel(previousStep)}
                            →
                            ${getStepLabel(currentStep)}
                        </p>

                        <p>
                            Von:
                            ${fromSite.name},
                            ${fromSite.city}
                        </p>

                        <p>
                            Nach:
                            ${toSite.name},
                            ${toSite.city}
                        </p>

                        <p>
                            Transportmittel:
                            ${mode.name}
                        </p>

                        <p>
                            Entfernung:
                            ${route.distanceKm}
                            km
                        </p>

                        <p>
                            Transportierte Masse:
                            ${(massKg * 1000).toFixed(1)}
                            g
                        </p>

                        <p>
                            CO₂:
                            ${co2.toFixed(4)}
                            kg CO₂e
                        </p>

                        <p>
                            Energie:
                            ${energy.toFixed(4)}
                            kWh
                        </p>
                    `;


                    container.appendChild(
                        section
                    );


                    transportNumber++;
                }
            );
        }
    );


    currentTransportTotals = {
        co2: totalCo2,
        energy: totalEnergy
    };


    const totals =
        document.createElement(
            "div"
        );


    totals.style.marginTop =
        "30px";


    totals.innerHTML = `
        <h3>
            Gesamt – Transport
        </h3>

        <p>
            <strong>CO₂:</strong>
            ${totalCo2.toFixed(4)}
            kg CO₂e
        </p>

        <p>
            <strong>Energie:</strong>
            ${totalEnergy.toFixed(4)}
            kWh
        </p>

        <p>
            <em>
                Der Versand des fertig verpackten
                Produktes ist noch nicht enthalten.
            </em>
        </p>
    `;


    container.appendChild(
        totals
    );


    calculateOverallBalance();
}


/*
==================================================
GESAMTBILANZ
==================================================
*/

function calculateOverallBalance() {

    const container =
        document.getElementById(
            "overallCalculation"
        );


    const base =
        getProductCalculationBase();


    if (
        !container ||
        !base
    ) {

        return;
    }


    const productMassKg =
        base.totalFabricWeightKg
        + currentComponentTotals.massKg;


    const packagingMassKg =
        currentPackagingTotals.massKg;


    const shippingMassKg =
        productMassKg
        + packagingMassKg;


    const totalCo2 =
        currentRawTotals.co2
        + currentComponentTotals.co2
        + currentPackagingTotals.co2
        + currentProductionTotals.co2
        + currentTransportTotals.co2;


    const totalWater =
        currentRawTotals.water
        + currentComponentTotals.water
        + currentPackagingTotals.water
        + currentProductionTotals.water;


    const totalEnergy =
        currentRawTotals.energy
        + currentComponentTotals.energy
        + currentPackagingTotals.energy
        + currentProductionTotals.energy
        + currentTransportTotals.energy;


    container.innerHTML = `
        <h3>
            Gewicht
        </h3>

        <p>
            Hauptstoff:
            ${base.totalFabricWeightGrams.toFixed(1)}
            g
        </p>

        <p>
            Weitere Produktbestandteile:
            ${(currentComponentTotals.massKg * 1000).toFixed(1)}
            g
        </p>

        <p>
            <strong>
                Produktgewicht:
                ${(productMassKg * 1000).toFixed(1)}
                g
            </strong>
        </p>

        <p>
            Verpackungsgewicht:
            ${(packagingMassKg * 1000).toFixed(1)}
            g
        </p>

        <p>
            <strong>
                Gewicht der Versandeinheit:
                ${(shippingMassKg * 1000).toFixed(1)}
                g
            </strong>
        </p>


        <h3>
            Umweltbilanz bisher
        </h3>

        <p>
            <strong>CO₂:</strong>
            ${totalCo2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            <strong>Wasser:</strong>
            ${totalWater.toFixed(1)}
            L
        </p>

        <p>
            <strong>Energie:</strong>
            ${totalEnergy.toFixed(3)}
            kWh
        </p>


        <h3>
            CO₂ nach Bereichen
        </h3>

        <p>
            Rohstoff Hauptstoff:
            ${currentRawTotals.co2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            Weitere Komponenten:
            ${currentComponentTotals.co2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            Verpackung:
            ${currentPackagingTotals.co2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            Produktion:
            ${currentProductionTotals.co2.toFixed(3)}
            kg CO₂e
        </p>

        <p>
            Transport:
            ${currentTransportTotals.co2.toFixed(4)}
            kg CO₂e
        </p>


        <p>
            <em>
                Pflege-, Haltbarkeits-,
                Reparatur- und Kreislaufinformationen
                werden nicht als Verbrauchswerte
                in die Umweltbilanz eingerechnet.
            </em>
        </p>
    `;
}


/*
==================================================
ALLE PRODUKTDATEN DARSTELLEN
==================================================
*/

function renderProductData(productId) {

    resetCurrentTotals();


    renderMaterialComposition(
        productId
    );


    renderProductComponents(
        productId
    );


    calculateComponentBalance();


    renderPackaging(
        productId
    );


    calculatePackagingBalance();


    renderCareInformation(
        productId
    );


    renderDurabilityInformation(
        productId
    );


    renderRepairInformation(
        productId
    );


    renderCircularityInformation(
        productId
    );


    renderMaterialSources(
        productId
    );


    renderProcessChain(
        productId
    );


    renderProcessAssignments(
        productId
    );


    calculateOverallBalance();
}


/*
==================================================
VARIANTE ANWENDEN
==================================================
*/

function applyVariant(variantId) {

    const variant =
        variants.find(
            item =>
                item.id ===
                variantId
        );


    if (!variant) {

        console.error(
            `Variante "${variantId}" wurde nicht gefunden.`
        );

        return;
    }


    document.getElementById(
        "product"
    ).value =
        variant.productId;


    document.getElementById(
        "size"
    ).value =
        variant.sizeId;


    document.getElementById(
        "color"
    ).value =
        variant.colorId;


    document.getElementById(
        "fit"
    ).value =
        variant.fitId;


    renderProductData(
        variant.productId
    );
}


/*
==================================================
STAMMDATEN LADEN
==================================================
*/

async function loadManufacturerData() {

    try {

        products =
            await loadJson(
                "data/products.json"
            );


        sizes =
            await loadJson(
                "data/sizes.json"
            );


        const colors =
            await loadJson(
                "data/colors.json"
            );


        fits =
            await loadJson(
                "data/fits.json"
            );


        materials =
            await loadJson(
                "data/materials.json"
            );


        components =
            await loadJson(
                "data/components.json"
            );


        packagingMaterials =
            await loadJson(
                "data/packagingMaterials.json"
            );


        careProfiles =
            await loadJson(
                "data/careProfiles.json"
            );


        durabilityProfiles =
            await loadJson(
                "data/durabilityProfiles.json"
            );


        repairProfiles =
            await loadJson(
                "data/repairProfiles.json"
            );


        circularityProfiles =
            await loadJson(
                "data/circularityProfiles.json"
            );


        materialSources =
            await loadJson(
                "data/materialSources.json"
            );


        variants =
            await loadJson(
                "data/variants.json"
            );


        companies =
            await loadJson(
                "data/companies.json"
            );


        sites =
            await loadJson(
                "data/sites.json"
            );


        departments =
            await loadJson(
                "data/departments.json"
            );


        processes =
            await loadJson(
                "data/processes.json"
            );


        processChains =
            await loadJson(
                "data/processChains.json"
            );


        processData =
            await loadJson(
                "data/processData.json"
            );


        siteEnvironmental =
            await loadJson(
                "data/siteEnvironmental.json"
            );


        transportModes =
            await loadJson(
                "data/transportModes.json"
            );


        transportRoutes =
            await loadJson(
                "data/transportRoutes.json"
            );


        fillSelect(
            "product",
            products
        );


        fillSelect(
            "size",
            sizes
        );


        fillSelect(
            "color",
            colors
        );


        fillSelect(
            "fit",
            fits
        );


        fillVariantSelect();


        if (
            variants.length > 0
        ) {

            applyVariant(
                variants[0].id
            );
        }


        document
            .getElementById(
                "variant"
            )
            .addEventListener(
                "change",
                event => {

                    applyVariant(
                        event.target.value
                    );
                }
            );


        document
            .getElementById(
                "product"
            )
            .addEventListener(
                "change",
                event => {

                    renderProductData(
                        event.target.value
                    );
                }
            );


        document
            .getElementById(
                "size"
            )
            .addEventListener(
                "change",
                () => {

                    calculateRawMaterialBalance();

                    calculateComponentBalance();

                    calculatePackagingBalance();

                    calculateProductionBalance();

                    calculateTransportBalance();

                    calculateOverallBalance();
                }
            );


        document
            .getElementById(
                "fit"
            )
            .addEventListener(
                "change",
                () => {

                    calculateRawMaterialBalance();

                    calculateComponentBalance();

                    calculatePackagingBalance();

                    calculateProductionBalance();

                    calculateTransportBalance();

                    calculateOverallBalance();
                }
            );


    } catch (error) {

        console.error(
            "Fehler beim Laden der Stammdaten:",
            error
        );
    }
}


/*
==================================================
START
==================================================
*/

loadManufacturerData();