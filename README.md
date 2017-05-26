# Pharos

Pharos is a small project that retrieves conversations from a Front inbox and graphically portrays their status on a SenseHat attached to a Raspberry Pi.

As conversations occur in the specified inboxes, the SenseHat will light up columns with the colour determined by the time elapsed.

It requires several environment variables to operate:

* `FRONT_API_KEY` - The API key for the Front customer [String]
* `INBOX_IDS` - One or more Front inbox IDs to examine. [String, comma separated IDs]
* `FRONT_SECRET_KEY`[Optional] - The secret key for event messages, should `EVENT_DRIVEN` be set [String]
* `INTERVAL`[Optional] - A polling interval in ms, should `EVENT_DRIVEN` not be set. [String]
* `EVENT_DRIVEN`[Optional] - If set, Pharos will not poll inboxes but instead wait for an event based on rules. ['1' to set, undefined or a falsey value for polling]

To allow Pharos to be event driven, ensure port 80 is publicly accessible (you can enable this by going to 'Actions' on a device page and then 'Enable Public Device URL'). Also ensure that you have set up rules on the appropriate inbox along with a trigger to post to the webhook URL.