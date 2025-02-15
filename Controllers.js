const Contact  = require("./Contact.js");

async function findPrimaryContact(contact){
    while(contact.linkedId){
        contact = await Contact.findById(contact.linkedId);
    }
    return contact;
}

async function getAllLinkedContacts(primaryIds){
    return await Contact.find({
        $or: [{ linkedId: { $in: primaryIds } }, { _id: { $in: primaryIds } }]
    });
}

async function handleIdentity(email, phoneNumber){
    let matchingContacts = await Contact.find({ $or: [{ email }, { phoneNumber }] });

    let emailPrimary = null, phonePrimary = null;
    for(let contact of matchingContacts){
        let primary = await findPrimaryContact(contact);
        if (contact.email === email) emailPrimary = primary;
        if (contact.phoneNumber === phoneNumber) phonePrimary = primary;
    }

    let primaryContact = emailPrimary || phonePrimary;

    if(emailPrimary && phonePrimary && emailPrimary._id.toString() !== phonePrimary._id.toString()){
        primaryContact = emailPrimary.createdAt < phonePrimary.createdAt ? emailPrimary : phonePrimary;
        let secondaryPrimary = emailPrimary === primaryContact ? phonePrimary : emailPrimary;
        let linkedContacts = await getAllLinkedContacts([primaryContact._id, secondaryPrimary._id]);

        for(let contact of linkedContacts){
            await Contact.findByIdAndUpdate(contact._id, { linkedId: primaryContact._id, linkPrecedence: "secondary" });
        }
    }

    if(!primaryContact){
        let newContact = new Contact({ phoneNumber, email, linkPrecedence: "primary" });
        await newContact.save();
        return {
            primaryID: newContact._id,
            emails: [email],
            phoneNumbers: [phoneNumber],
            secondaryIDs: []
        };
    }

    let linkedContacts = await getAllLinkedContacts([primaryContact._id]);
    let emails = new Set([primaryContact.email, ...linkedContacts.map(c => c.email)].filter(Boolean));
    let phoneNumbers = new Set([primaryContact.phoneNumber, ...linkedContacts.map(c => c.phoneNumber)].filter(Boolean));
    let secondaryIDs = linkedContacts.map(c => c._id.toString()).filter(id => id !== primaryContact._id.toString());

    if(!emails.has(email) && !phoneNumbers.has(phoneNumber)){
        let newContact = new Contact({ phoneNumber, email, linkedId: primaryContact._id, linkPrecedence: "secondary" });
        await newContact.save();
        secondaryIDs.push(newContact._id.toString());
    }

    return {
        primaryID: primaryContact._id,
        emails: Array.from(emails),
        phoneNumbers: Array.from(phoneNumbers),
        secondaryIDs
    };
}

module.exports = { handleIdentity };
