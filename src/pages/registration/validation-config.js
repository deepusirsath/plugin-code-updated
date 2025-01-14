import { ERROR_MESSAGES } from "/src/constant/error_message";

export const validationConfig = {
  name: [
    { condition: (value) => !value, message: ERROR_MESSAGES.NAME_EMPTY },
    {
      condition: (value) => value.length > 50,
      message: ERROR_MESSAGES.NAME_EXCEEDS_50_CHARACTERS,
    },
    {
      condition: (value) => !/^[a-zA-Z\s']+$/.test(value),
      message: ERROR_MESSAGES.NAME_CONTAINS_NON_LETTERS,
    },
    {
      condition: (value) =>
        !value.split(" ").every((word) => /^[A-Z][a-zA-Z']*$/.test(word)),
      message: ERROR_MESSAGES.NAME_FIRST_LETTER_CAPITAL,
    },
  ],
  mobile: [
    { condition: (value) => !value, message: ERROR_MESSAGES.EMAIL_EMPTY },
    {
      condition: (value) => !/^\d{10}$/.test(value),
      message: ERROR_MESSAGES.MOBILE_INVALID,
    },
  ],
  email: [
    { condition: (value) => !value, message: ERROR_MESSAGES.EMAIL_EMPTY },
    {
      condition: (value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: EMAIL_EMPTY.EMAIL_INVALID,
    },
  ],
};