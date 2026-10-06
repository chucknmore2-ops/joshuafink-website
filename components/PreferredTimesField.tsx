'use client'

import { useState } from 'react'

const OPTIONS = ['Weekday morning', 'Weekday afternoon', 'Weekday evening', 'Saturday', 'Sunday']

export default function PreferredTimesField() {
  const [value, setValue] = useState('')

  function add(phrase: string) {
    setValue((current) => {
      if (current.toLowerCase().includes(phrase.toLowerCase())) return current
      return current ? `${current}; ${phrase}` : phrase
    })
  }

  return (
    <div>
      <label
        htmlFor="showing-times"
        className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
      >
        Preferred times *
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {OPTIONS.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => add(phrase)}
            className="border border-[#E8E8E8] text-xs font-semibold px-3 py-1.5 rounded-full hover:border-black"
          >
            {phrase}
          </button>
        ))}
      </div>
      <input
        id="showing-times"
        name="timeline"
        required
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Weekday evenings, Saturday morning"
        className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
      />
    </div>
  )
}
