import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { Header, Footer, SectionEyebrow } from "@/components/site"
import { PropertyResults } from "@/components/property-results"
export const metadata: Metadata={title:"Find a House",description:"Explore illustrative rental homes across Nakuru, Nairobi, Naivasha, Nyandarua and Eldoret."}
type QueryValue=string|string[]|undefined
export default async function PropertiesPage({searchParams}:{searchParams:Promise<Record<string,QueryValue>>}){
 const params=await searchParams
 const value=(key:string)=>typeof params[key]==="string"?params[key] as string:undefined
 const initialFilters={location:value("location"),type:value("type"),bedrooms:value("bedrooms"),minPrice:value("minPrice"),maxPrice:value("maxPrice"),availability:value("availability")}
 return <><Header/><main id="main-content" className="properties-page"><section className="page-hero"><div className="wrap properties-intro"><div><SectionEyebrow>THE RENT EASY HOME FINDER</SectionEyebrow><h1>Find a place to <em>belong.</em></h1><p>Search rental homes by location, layout and budget. Sample listings are provided to preview the experience.</p></div><span className="coming-soon-pill"><span/> ILLUSTRATIVE LISTINGS</span></div></section><section className="page-content"><div className="wrap"><PropertyResults initialFilters={initialFilters}/></div></section></main><Footer/></>
}
