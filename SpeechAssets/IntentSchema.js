{
  "intents": [
    {
      "name": "AMAZON.CancelIntent",
      "samples": []
    },
    {
      "name": "AMAZON.HelpIntent",
      "samples": []
    },
    {
      "name": "AMAZON.NoIntent",
      "samples": []
    },
    {
      "name": "AMAZON.StopIntent",
      "samples": []
    },
    {
      "name": "AMAZON.YesIntent",
      "samples": []
    },
    {
      "name": "AnswerIntent",
      "samples": [
        "{phrase}"
      ],
      "slots": [
        {
          "name": "phrase",
          "type": "LIST_OF_PHRASES",
          "samples": []
        }
      ]
    },
    {
      "name": "PracticeIntent",
      "samples": [
        "{languages}"
      ],
      "slots": [
        {
          "name": "languages",
          "type": "LIST_OF_LANGUAGES",
          "samples": []
        }
      ]
    }
  ],
  "types": [
    {
      "name": "LIST_OF_LANGUAGES",
      "values": [
        {
          "id": null,
          "name": {
            "value": "spanish",
            "synonyms": []
          }
        }
      ]
    },
    {
      "name": "LIST_OF_PHRASES",
      "values": [
        {
          "id": null,
          "name": {
            "value": "no just bring the check please",
            "synonyms": []
          }
        },
        {
          "id": null,
          "name": {
            "value": "great",
            "synonyms": []
          }
        },
        {
          "id": null,
          "name": {
            "value": "just some water please",
            "synonyms": []
          }
        },
        {
          "id": null,
          "name": {
            "value": "medium rare",
            "synonyms": []
          }
        },
        {
          "id": null,
          "name": {
            "value": "sounds good I would like some steak",
            "synonyms": []
          }
        },
        {
          "id": null,
          "name": {
            "value": "sure why not",
            "synonyms": []
          }
        },
        {
          "id": null,
          "name": {
            "value": "no this is my first time here",
            "synonyms": []
          }
        }
      ]
    }
  ]
}
