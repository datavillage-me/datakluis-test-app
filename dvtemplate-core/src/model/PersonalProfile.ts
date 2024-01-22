/**
 * User profile, as stored in the pod
 */
export type PersonalProfile = {

  /**
   * unique identifier, as a URI
   * TODO choose URI domain. use webID ?
   */
  uri: string;

  interests: {
    // URIs should be resolvable
    mediaGroupId: string,
    score: number}[],

  /**
   * List of media groups
   * TODO find a term to differentiate media groups (program, season, page) from a media itself
   */
  // have simple URI list, or extra metadata like date ?
  favourites: string[],

  /**
   * The viewing history
   * TODO use sdo:WatchAction ?
   */
  history:
    {
      mediaId: string,
      // timestamp:
    }[]
}

