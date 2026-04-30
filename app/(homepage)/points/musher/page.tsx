'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { GET_POINTS_WITH_ENTRANTS } from '@/graphql/query/points'
import { Loading } from '@/components/skeleton'

interface RankingEntry {
  rank: number
  name: string
  regNumber: string
  points: number
  events: number
  avg: number
}

interface RankingsByClass {
  [className: string]: RankingEntry[]
}

const MusherPage = () => {
  const [displayedClasses, setDisplayedClasses] = useState<string[]>([])
  
  // Fetch all points and entrants data
  const { loading, error, data } = useQuery(GET_POINTS_WITH_ENTRANTS, {
    fetchPolicy: 'network-only',
  })

  // Process the data to create rankings by class
  const rankingsByClass = useMemo(() => {
    if (!data) return {}

    const { getAllPoints, getAllEntrants, getAllEvents } = data
    
    // Create a map of event IDs to event objects for quick lookup
    const eventMap = new Map()
    if (getAllEvents) {
      getAllEvents.forEach((event: any) => {
        eventMap.set(event._id, event)
      })
    }

    // Create a map of entrant IDs to entrant objects for quick lookup
    const entrantMap = new Map()
    if (getAllEntrants) {
      getAllEntrants.forEach((entrant: any) => {
        entrantMap.set(entrant._id, entrant)
      })
    }
    
    // Group points by musher name and class
    const pointsByMusherAndClass: Record<string, Record<string, number[]>> = {}
    
    getAllPoints?.forEach((point: any) => {
      const entrant = entrantMap.get(point.entrantId)
      if (!entrant) return
      
      // Skip non-musher races or races without proper classes
      if (
        !entrant.class?.toLowerCase().includes('speed') && 
        !entrant.raceType?.toLowerCase().includes('started') &&
        entrant.raceType !== 'musher'
      ) {
        return
      }
      
      const musherName = entrant.name
      const classKey = entrant.customClass || 'Undefined Class'
      
      if (!pointsByMusherAndClass[musherName]) {
        pointsByMusherAndClass[musherName] = {}
      }
      
      if (!pointsByMusherAndClass[musherName][classKey]) {
        pointsByMusherAndClass[musherName][classKey] = []
      }
      
      // Add this point to the musher's class array
      if (point.points > 0) {
        pointsByMusherAndClass[musherName][classKey].push(point.points)
      }
    })
    
    // Convert the points data into rankings by class
    const rankings: RankingsByClass = {}
    
    // Get first registration number found for each musher
    const musherToRegMap = new Map()
    getAllEntrants?.forEach((entrant: any) => {
      if (entrant.associatedDog && entrant.associatedDog.length > 0) {
        const registration = entrant.associatedDog[0].NZFSSRegistration
        if (registration && !musherToRegMap.has(entrant.name)) {
          musherToRegMap.set(entrant.name, registration)
        }
      }
    })

    // Process each musher and their points by class
    Object.entries(pointsByMusherAndClass).forEach(([musherName, classesByMusher]) => {
      Object.entries(classesByMusher).forEach(([className, pointsArray]) => {
        if (!rankings[className]) {
          rankings[className] = []
        }
        
        const totalPoints = pointsArray.reduce((sum, points) => sum + points, 0)
        const avg = pointsArray.length > 0 ? totalPoints / pointsArray.length : 0
        
        rankings[className].push({
          name: musherName,
          regNumber: musherToRegMap.get(musherName) || '-',
          points: totalPoints,
          events: pointsArray.length,
          avg: parseFloat(avg.toFixed(2)),
          rank: 0  // Will be set later
        })
      })
    })
    
    // Sort each class rankings by points and assign ranks
    Object.entries(rankings).forEach(([className, mushers]) => {
      // Sort by points (descending)
      const sortedMushers = [...mushers].sort((a, b) => b.points - a.points)
      
      // Assign ranks (1-based)
      sortedMushers.forEach((musher, index) => {
        musher.rank = index + 1
      })
      
      rankings[className] = sortedMushers
    })
    
    return rankings
  }, [data])
  
  // Set the displayed classes when data loads
  useEffect(() => {
    if (rankingsByClass && Object.keys(rankingsByClass).length > 0) {
      setDisplayedClasses(Object.keys(rankingsByClass))
    }
  }, [rankingsByClass])
  
  // Format class name for display
  const formatClassName = (className: string): string => {
    if (className === 'Undefined Class') return 'Mixed Classes'
    
    // Extract dog count if present (e.g., "2-Dog", "Single-Dog")
    const dogCountMatch = className.match(/(\d+)-Dog|Single-Dog/)
    const dogCount = dogCountMatch 
      ? dogCountMatch[0].includes('Single') 
        ? '1' 
        : dogCountMatch[0].replace('-Dog', '')
      : null
    
    if (dogCount) {
      return `Speed Limited ${dogCount === '1' ? 'One' : dogCount} (${dogCount}) Dog ${className.replace(/(\d+)-Dog|Single-Dog/, '')}`
    }
    
    return className
  }

  if (loading) return <Loading />
  
  if (error) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="max-w-[1200px] mx-auto p-6">
          <h1 className="text-[32px] font-bold text-center mb-6">Musher Ranking</h1>
          <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-600">
            Error loading rankings data: {error.message}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto p-6">
        <h1 className="text-[32px] font-bold text-center mb-6">Musher Ranking</h1>

        <div className="space-y-6">
          {displayedClasses.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-6 text-center text-gray-500">
              No ranking data available
            </div>
          ) : (
            displayedClasses.map((className) => (
              <div key={className} className="rounded-lg overflow-hidden border border-gray-200">
                <div className="px-4 py-3 bg-[#212121] text-white">
                  <h2 className="font-medium">{formatClassName(className)}</h2>
                </div>
                
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F5F5] border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-medium">Rank</th>
                      <th className="px-4 py-3 text-left font-medium">Musher</th>
                      <th className="px-4 py-3 text-left font-medium">Reg#</th>
                      <th className="px-4 py-3 text-left font-medium">Points</th>
                      <th className="px-4 py-3 text-left font-medium">Events</th>
                      <th className="px-4 py-3 text-left font-medium">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingsByClass[className].length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                          No mushers found in this class
                        </td>
                      </tr>
                    ) : (
                      rankingsByClass[className].map((musher) => (
                        <tr key={`${className}-${musher.name}`} className="border-b border-gray-200">
                          <td className="px-4 py-3">{musher.rank}</td>
                          <td className="px-4 py-3">{musher.name}</td>
                          <td className="px-4 py-3">{musher.regNumber}</td>
                          <td className="px-4 py-3">{musher.points}</td>
                          <td className="px-4 py-3">{musher.events}</td>
                          <td className="px-4 py-3">{musher.avg}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MusherPage 