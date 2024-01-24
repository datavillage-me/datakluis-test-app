import {PersonalProfile} from "../PersonalProfile";

export const user_001: PersonalProfile = {

    uri: "https://acme.com/user/001",

    // have simple URI list, or extra metadata like date ?
    favourites: [
        "https://acme.com/objects/001"
    ],

    history: [
        {
            objectUri: "https://acme.com/objects/001",
            action: "https://acme.com/actions/VIEWED",
            timestamp: "2024-01-10T15:00:00.000Z"
        }
    ]
};