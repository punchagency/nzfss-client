// Map of club names to their official abbreviations
export const CLUB_ABBREVIATIONS: { [key: string]: string } = {
  'Australasian Sled Dog Club': 'ASDC',
  'Canterbury Sled Dog Club': 'CSDC',
  'Central Territories Siberian Husky Club': 'CTSHC',
  'Fur Flyers Sled Dog Club': 'FFSDC',
  'Great Northern Siberian Husky Club': 'GNSHC',
  'Main Range Sled Dog Club': 'MRSDC',
  'Northern Alaskan Malamute Club': 'NAMC',
  'Ridge Runners Sled Dog Racing Club': 'RRSDRC',
  'South Island Siberian Husky Club': 'SISHC',
  'Southern Regions Sled Dog Club': 'SRSDC',
  'Southland Sled Dog Association': 'SSDA',
  'Trail Blazers Sled Dog Club': 'TBSDC',
  'New Zealand Federation of Sled Dog Sports': 'NZFSS'
};

/**
 * Gets the official abbreviation for a club name
 * @param clubName The full name of the club
 * @returns The official abbreviation or a generated one if not found
 */
export const getClubAbbreviation = (clubName: string): string => {
  // Handle null/undefined case
  if (!clubName) return 'N/A';

  // Try to find the exact match first
  const exactMatch = CLUB_ABBREVIATIONS[clubName];
  if (exactMatch) return exactMatch;

  // Try to find a case-insensitive match
  const lowerClubName = clubName.toLowerCase();
  for (const [key, value] of Object.entries(CLUB_ABBREVIATIONS)) {
    if (key.toLowerCase() === lowerClubName) {
      return value;
    }
  }

  // If no match found, generate an abbreviation
  // Remove common words and generate abbreviation from first letters
  const wordsToRemove = ['of', 'the', 'and'];
  const words = clubName.split(' ')
    .filter(word => 
      word.trim() !== '' && !wordsToRemove.includes(word.toLowerCase())
    );
  
  // Filter out empty strings and ensure there's at least one character before calling toUpperCase
  return words
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('');
}; 