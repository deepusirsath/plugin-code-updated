// This file contains all the error messages used in the application.
// The error messages are used in the application to display the error message to the user.
// The error messages are used in the validation of the form fields.

export const ERROR_MESSAGES = {
  NAME_EMPTY: "Name cannot be empty.",
  NAME_EXCEEDS_50_CHARACTERS: "Name cannot exceed 50 characters.",
  NAME_CONTAINS_NON_LETTERS:
    "Name must only contain letters, spaces, and apostrophes.",
  NAME_FIRST_LETTER_CAPITAL: "Each word must start with a capital letter.",
  MOBILE_EMPTY: "Mobile number cannot be empty.",
  MOBILE_INVALID: "Invalid Mobile Number Must Be 10 Digits.",
  EMAIL_EMPTY: "Email cannot be empty.",
  EMAIL_INVALID: "Invalid Email format.",
  LICENSE_ID_EMPTY: "License ID cannot be empty.",
  LICENSE_ID_INVALID: "License ID must be exactly 64 characters long.",
  LICENSE_ID_NOT_CORRECT: "License ID is not correct.",
  LICENSE_ID_ERROR: "Error verifying license. Please try again.",
  LICENSE_ID_NOT_FOUND: "License ID not found.",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  API_FAILED_MESSAGE:
    "Unable to connect to the service. Please check your internet connection and try again.",
  EMAIL_ID_NOT_FOUND: "Email ID not found.",
  FAILED_TO_FETCH_EMAIL_DATA: "Failed to fetch email data.",
  FAILED_TO_UPLOAD_FILE: "Failed to upload file on server.",
  FAILED_TO_FETCH_USER_DETAILS:'Failed to fetch user details.'
};
