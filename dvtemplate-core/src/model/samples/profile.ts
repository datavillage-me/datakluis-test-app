import {PersonalProfile} from "../PersonalProfile";

export const user_vrt_001 = {
    id: "8528d2de-0c68-472b-ad9d-ff843c154f8f",

    interests: [
        {
            mediaGroupId: "1459955889901",
            score: 669e6
        }
    ],

    favourites: [
        "1459955889901"
    ],

    history: [
        {
            mediaId: "vid-a6dc895f-c934-4908-9eff-58d211801d1e",
            // timestamp:
        }
    ]
};


export const user_sdo_001: PersonalProfile = {

    uri: "https://vrt.be/users/8528d2de-0c68-472b-ad9d-ff843c154f8f",

    interests: [
        {
            // URIs should be resolvable
            mediaGroupId: "https://vrt.be/medias/1459955889901",
            score: 669e6
        }
    ],

    // have simple URI list, or extra metadata like date ?
    favourites: [
        "https://vrt.be/medias/1459955889901"
    ],

    history: [
        {
            mediaId: "vid-a6dc895f-c934-4908-9eff-58d211801d1e",
        }
    ]
};