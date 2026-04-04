const { getFirestore } = require("../services/firebaseService");

const VOLUNTEERS_COLLECTION = "volunteers";

const defaultVolunteers = [
  { name: "Rahul Sharma", skill: "Medical", location: "Kolkata", phone: "9876543210", email: "rahul.sharma@gmail.com" },
  { name: "Ananya Das", skill: "Teaching", location: "Kolkata", phone: "9123456780", email: "ananya.das@gmail.com" },
  { name: "Amit Verma", skill: "Food", location: "Delhi", phone: "9012345678", email: "amit.verma@gmail.com" },
  { name: "Neha Kapoor", skill: "Rescue", location: "Mumbai", phone: "9988776655", email: "neha.kapoor@gmail.com" },
  { name: "Arjun Mehta", skill: "Logistics", location: "Mumbai", phone: "9090909090", email: "arjun.mehta@gmail.com" },
  { name: "Priya Singh", skill: "General", location: "Lucknow", phone: "9345678901", email: "priya.singh@gmail.com" },
  { name: "Rohit Gupta", skill: "Medical", location: "Delhi", phone: "9234567890", email: "rohit.gupta@gmail.com" },
  { name: "Sneha Iyer", skill: "Teaching", location: "Chennai", phone: "9871234560", email: "sneha.iyer@gmail.com" },
  { name: "Vikram Reddy", skill: "Food", location: "Hyderabad", phone: "9011122233", email: "vikram.reddy@gmail.com" },
  { name: "Pooja Jain", skill: "Rescue", location: "Jaipur", phone: "9887766554", email: "pooja.jain@gmail.com" }
];

let seeded = false;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getCollection() {
  const db = getFirestore();
  return db.collection(VOLUNTEERS_COLLECTION);
}

function normalizeVolunteer(rawVolunteer) {
  const skills = toSkillsArray(rawVolunteer.skills || rawVolunteer.skill);

  return {
    id: String(rawVolunteer.id || "").trim() || undefined,
    name: String(rawVolunteer.name || "").trim(),
    skills,
    skill: skills[0] || "General",
    location: String(rawVolunteer.location || "").trim(),
    phone: String(rawVolunteer.phone || "").trim(),
    email: String(rawVolunteer.email || "").trim()
  };
}

async function ensureSeedData() {
  if (seeded) {
    return;
  }

  const collection = getCollection();
  const snapshot = await collection.limit(1).get();

  if (snapshot.empty) {
    const batch = collection.firestore.batch();

    for (const volunteer of defaultVolunteers) {
      const docRef = collection.doc();
      const normalized = normalizeVolunteer({ ...volunteer, id: docRef.id });
      batch.set(docRef, normalized);
    }

    await batch.commit();
  }

  seeded = true;
}

async function getAllVolunteers() {
  await ensureSeedData();

  const snapshot = await getCollection().get();
  return snapshot.docs.map((doc) => normalizeVolunteer({ ...doc.data(), id: doc.id }));
}

function toSkillsArray(value) {
  if (Array.isArray(value)) {
    return value.map((skill) => String(skill || "").trim()).filter(Boolean);
  }

  const oneSkill = String(value || "").trim();
  return oneSkill ? [oneSkill] : [];
}

async function addVolunteer(volunteer) {
  await ensureSeedData();

  const collection = getCollection();
  const docRef = collection.doc();
  const entry = normalizeVolunteer({ ...volunteer, id: docRef.id });

  await docRef.set(entry);
  return entry;
}

function calculateScore(volunteer, requiredSkill, location) {
  const targetSkill = normalize(requiredSkill);
  const targetLocation = normalize(location);
  const volunteerSkills = toSkillsArray(volunteer.skills || volunteer.skill).map(normalize);

  let score = 0;
  if (volunteerSkills.includes(targetSkill)) {
    score += 2;
  }
  if (normalize(volunteer.location) === targetLocation) {
    score += 2;
  }
  if (volunteerSkills.includes("general")) {
    score += 1;
  }

  return score;
}

async function findBestVolunteer(requiredSkill, location) {
  const volunteers = await getAllVolunteers();
  const targetSkill = normalize(requiredSkill);
  const targetLocation = normalize(location);
  const exactMatches = volunteers.filter((volunteer) => {
    const volunteerSkills = toSkillsArray(volunteer.skills || volunteer.skill).map(normalize);
    return volunteerSkills.includes(targetSkill) && normalize(volunteer.location) === targetLocation;
  });

  if (exactMatches.length > 0) {
    return {
      volunteer: exactMatches[0],
      volunteers: exactMatches,
      score: 4,
      exactMatch: true,
      message:
        exactMatches.length > 1
          ? `Found ${exactMatches.length} exact volunteer matches`
          : "Exact match found"
    };
  }

  let bestVolunteer = null;
  let bestScore = -1;

  for (const volunteer of volunteers) {
    const score = calculateScore(volunteer, requiredSkill, location);
    if (score > bestScore) {
      bestVolunteer = volunteer;
      bestScore = score;
    }
  }

  return {
    volunteer: bestScore > 0 ? bestVolunteer : null,
    volunteers: bestScore > 0 && bestVolunteer ? [bestVolunteer] : [],
    score: bestScore,
    exactMatch: false,
    message: bestScore > 0
      ? "No exact match found. Best available volunteer assigned"
      : "No exact match found"
  };
}

module.exports = {
  addVolunteer,
  calculateScore,
  findBestVolunteer,
  getAllVolunteers
};
