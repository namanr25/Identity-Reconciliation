const Contact = require("./Contact.js");

// ✅ Helper function to find the root primary contact
async function findPrimaryContact(contact) {
    while (contact.linkedId) {
        contact = await Contact.findById(contact.linkedId);
    }
    return contact;
}

// ✅ Helper function to fetch all linked contacts recursively
async function getAllLinkedContacts(primaryId) {
    let allContacts = new Map();
    let queue = [primaryId];

    while (queue.length > 0) {
        let currentId = queue.pop();
        if (!allContacts.has(currentId)) {
            let contacts = await Contact.find({
                $or: [{ linkedId: currentId }, { _id: currentId }]
            });
            contacts.forEach(contact => {
                if (!allContacts.has(contact._id.toString())) {
                    allContacts.set(contact._id.toString(), contact);
                    queue.push(contact._id.toString());
                }
            });
        }
    }
    return Array.from(allContacts.values());
}

// ✅ Main function to handle identity merging
async function handleIdentity(email, phoneNumber) {
    // Step 1: Find all matching contacts by email or phone
    let matchingContacts = await Contact.find({
        $or: [{ email }, { phoneNumber }]
    });

    let primaryContacts = new Set();

    // Step 2: Identify primary contacts for all matches
    for (let contact of matchingContacts) {
        let primary = await findPrimaryContact(contact);
        primaryContacts.add(primary);
    }

    let primaryContact = null;
    if (primaryContacts.size > 1) {
        // Step 3: Merge all clusters into the oldest primary contact
        primaryContact = [...primaryContacts].reduce((oldest, current) =>
            current.createdAt < oldest.createdAt ? current : oldest
        );

        let secondaryContacts = [...primaryContacts].filter(c => c._id.toString() !== primaryContact._id.toString());
        
        // Update all secondary contacts and their linked contacts
        for (let secondary of secondaryContacts) {
            let linkedContacts = await getAllLinkedContacts(secondary._id);
            for (let contact of linkedContacts) {
                await Contact.findByIdAndUpdate(contact._id, {
                    linkedId: primaryContact._id,
                    linkPrecedence: "secondary"
                });
            }
        }
    } else {
        primaryContact = [...primaryContacts][0] || null;
    }

    // Step 4: Create a new primary contact if none exists
    if (!primaryContact) {
        let newContact = new Contact({ phoneNumber, email, linkPrecedence: "primary" });
        await newContact.save();
        return {
            primaryID: newContact._id,
            emails: [email],
            phoneNumbers: [phoneNumber],
            secondaryIDs: []
        };
    }

    // Step 5: Get all associated contacts to prepare response
    let linkedContacts = await getAllLinkedContacts(primaryContact._id);
    let emails = new Set([primaryContact.email, ...linkedContacts.map(c => c.email)].filter(Boolean));
    let phoneNumbers = new Set([primaryContact.phoneNumber, ...linkedContacts.map(c => c.phoneNumber)].filter(Boolean));
    let secondaryIDs = linkedContacts.map(c => c._id.toString()).filter(id => id !== primaryContact._id.toString());

    // Step 6: If the new email or phone is not in the cluster, create a secondary contact
    let isNewContactNeeded = false;

    if (!emails.has(email) || !phoneNumbers.has(phoneNumber)) {
        isNewContactNeeded = true;
    }

    if (isNewContactNeeded) {
        let newContact = new Contact({
            phoneNumber,
            email,
            linkedId: primaryContact._id,
            linkPrecedence: "secondary"
        });
        await newContact.save();
        secondaryIDs.push(newContact._id.toString());

        // Update phoneNumbers and emails dynamically
        emails.add(email);
        phoneNumbers.add(phoneNumber);
    }

    return {
        primaryID: primaryContact._id,
        emails: Array.from(emails),
        phoneNumbers: Array.from(phoneNumbers),
        secondaryIDs
    };
}

module.exports = { handleIdentity };
