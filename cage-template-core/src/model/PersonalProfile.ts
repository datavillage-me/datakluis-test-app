/**
 * User profile, as stored in the pod
 */
export type PersonalProfile = {

    /**
     * unique identifier, as a URI
     */
    uri: string;

    /**
     * List of favorited objects
     */
    favourites: string[],

    /**
     * Behaviour history
     */
    history:
        {
            objectUri: string
            action: string,
            timestamp: string
        }[]

    /**
     * unique identifier, as a URI
     */
    notificationEmail?: string;
}

