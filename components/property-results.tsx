"use client"

import { useMemo, useState } from "react"
import { BedDouble, ChevronDown, MapPin, Search, SlidersHorizontal } from "lucide-react"
import { properties } from "@/lib/properties"
import { NewsletterNote, PropertyCard } from "@/components/site"

type SearchFilters={location?:string;type?:string;bedrooms?:string;minPrice?:string;maxPrice?:string;availability?:string}
export function PropertyResults({initialFilters}:{initialFilters?:SearchFilters}){
 const [query,setQuery]=useState("")
 const [location,setLocation]=useState(initialFilters?.location??"")
 const [type,setType]=useState(initialFilters?.type??"")
 const [beds,setBeds]=useState(initialFilters?.bedrooms??"")
 const [minPrice,setMinPrice]=useState(initialFilters?.minPrice??"")
 const [maxPrice,setMaxPrice]=useState(initialFilters?.maxPrice??"")
 const [availability,setAvailability]=useState(initialFilters?.availability??"")
 const [sort,setSort]=useState("newest")
 const [showAll,setShowAll]=useState(false)
 const rangeInvalid=Boolean(minPrice&&maxPrice&&Number(minPrice)>Number(maxPrice))
 const shown=useMemo(()=>{
  let results=properties.filter(property=>(!query||`${property.name} ${property.location} ${property.county}`.toLowerCase().includes(query.toLowerCase()))&&(!location||`${property.location} ${property.county}`.toLowerCase().includes(location.toLowerCase()))&&(!type||property.type===type||property.size.toLowerCase()===type.toLowerCase())&&(!beds||property.bedrooms>=Number(beds))&&(!minPrice||property.rent>=Number(minPrice))&&(!maxPrice||property.rent<=Number(maxPrice))&&(!availability||property.availability===availability))
  if(sort==="low")results=[...results].sort((a,b)=>a.rent-b.rent)
  if(sort==="high")results=[...results].sort((a,b)=>b.rent-a.rent)
  return rangeInvalid?[]:results
 },[query,location,type,beds,minPrice,maxPrice,availability,sort,rangeInvalid])
 const visible=showAll?shown:shown.slice(0,3)
 const clear=()=>{setQuery("");setLocation("");setType("");setBeds("");setMinPrice("");setMaxPrice("");setAvailability("");setSort("newest");setShowAll(false)}
 const inputChanged=(setter:(value:string)=>void)=>(event:React.ChangeEvent<HTMLSelectElement>)=>{setter(event.target.value);setShowAll(false)}
 return <><NewsletterNote/><div className="listing-filters"><label className="filter-search"><Search size={16}/><input aria-label="Search by property name" value={query} onChange={event=>{setQuery(event.target.value);setShowAll(false)}} placeholder="Search by property name"/></label>
  <label className="filter-select"><MapPin size={15}/><select aria-label="Filter by location" value={location} onChange={inputChanged(setLocation)}><option value="">All locations</option>{["Nakuru","Naivasha","Nairobi","Nyandarua","Eldoret"].map(item=><option key={item}>{item}</option>)}</select><ChevronDown size={14}/></label>
  <label className="filter-select"><SlidersHorizontal size={15}/><select aria-label="Filter by property type" value={type} onChange={inputChanged(setType)}><option value="">All property types</option>{["Bedsitter","1 Bedroom","2 Bedroom","3 Bedroom","House","Apartment","Maisonette","Commercial"].map(item=><option key={item}>{item}</option>)}</select><ChevronDown size={14}/></label>
  <label className="filter-select"><BedDouble size={15}/><select aria-label="Filter by bedrooms" value={beds} onChange={inputChanged(setBeds)}><option value="">Any bedrooms</option><option value="1">1+ bedrooms</option><option value="2">2+ bedrooms</option><option value="3">3+ bedrooms</option></select><ChevronDown size={14}/></label>
  <label className="filter-select"><span className="filter-label">Min KSh</span><select aria-label="Minimum monthly rent" value={minPrice} onChange={inputChanged(setMinPrice)}><option value="">No minimum</option><option value="10000">10,000+</option><option value="15000">15,000+</option><option value="25000">25,000+</option></select><ChevronDown size={14}/></label>
  <label className="filter-select"><span className="filter-label">Max KSh</span><select aria-label="Maximum monthly rent" value={maxPrice} onChange={inputChanged(setMaxPrice)}><option value="">No maximum</option><option value="15000">15,000</option><option value="25000">25,000</option><option value="50000">50,000</option></select><ChevronDown size={14}/></label>
  <label className="filter-select"><span className="filter-label">Status</span><select aria-label="Filter by availability" value={availability} onChange={inputChanged(setAvailability)}><option value="">Any</option><option value="Available now">Available now</option><option value="Coming soon">Coming soon</option></select><ChevronDown size={14}/></label>
  <label className="filter-select sort-select"><span className="filter-label">Sort</span><select aria-label="Sort properties" value={sort} onChange={inputChanged(setSort)}><option value="newest">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select><ChevronDown size={14}/></label>
 </div><p className="result-caption">Showing <strong>{shown.length===0?0:visible.length}</strong> of <strong>{shown.length}</strong> illustrative {shown.length===1?"property":"properties"}<span> · Example listings only; availability is not confirmed</span></p>
 {shown.length>0?<><div className="property-grid">{visible.map(property=><PropertyCard key={property.id} property={property}/>)}</div>{shown.length>3&&<div className="load-more-row"><button className="button button-outline" onClick={()=>setShowAll(!showAll)}>{showAll?"Show fewer homes":"Load more homes"}<ChevronDown className={showAll?"rotate-up":""} size={15}/></button><span>{showAll?"All sample listings shown":"Three sample listings shown"}</span></div>}</>:<div className="empty-state"><span><Search/></span><h3>{rangeInvalid?"Check your price range":"No preview listings match those filters"}</h3><p>{rangeInvalid?"Minimum rent must be lower than maximum rent.":"Try another location, adjust your price range, or clear the filters to see the full sample set."}</p><button className="button button-outline" onClick={clear}>Clear filters</button></div>}</>
}
