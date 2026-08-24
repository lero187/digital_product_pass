/*
==================================================
DPP IN SUPABASE SPEICHERN
==================================================
*/

async function saveDppOnline(dpp) {

    const response =
        await fetch(
            SUPABASE_DPP_ENDPOINT,
            {
                method: "POST",

                headers: {
                    "apikey":
                        SUPABASE_PUBLISHABLE_KEY,

                    "Content-Type":
                        "application/json",

                    "Prefer":
                        "return=representation"
                },

                body:
                    JSON.stringify({
                        dpp_id:
                            dpp.dppId,

                        sku:
                            dpp.identification.sku,

                        data:
                            dpp
                    })
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            `Supabase Fehler ${response.status}: ${errorText}`
        );
    }


    return await response.json();
}