import type { PartSeed } from "../types"
import { pmAgileDelivery } from "./sections/pm-agile-delivery"
import { pmAiProducts } from "./sections/pm-ai-products"
import { pmAnalytics } from "./sections/pm-analytics"
import { pmCareer } from "./sections/pm-career"
import { pmCompetitiveAdvantage } from "./sections/pm-competitive-advantage"
import { pmCompetitiveAnalysis } from "./sections/pm-competitive-analysis"
import { pmCustomerInterviews } from "./sections/pm-customer-interviews"
import { pmCustomerValue } from "./sections/pm-customer-value"
import { pmDesignAndUsability } from "./sections/pm-design-and-usability"
import { pmDisruption } from "./sections/pm-disruption"
import { pmExperimentation } from "./sections/pm-experimentation"
import { pmFeaturesAndValue } from "./sections/pm-features-and-value"
import { pmGrowthLoops } from "./sections/pm-growth-loops"
import { pmGrowthStrategy } from "./sections/pm-growth-strategy"
import { pmGtmStrategy } from "./sections/pm-gtm-strategy"
import { pmJobsToBeDone } from "./sections/pm-jobs-to-be-done"
import { pmLaunching } from "./sections/pm-launching"
import { pmMetrics } from "./sections/pm-metrics"
import { pmMvpAndExperiments } from "./sections/pm-mvp-and-experiments"
import { pmNewProductDevelopment } from "./sections/pm-new-product-development"
import { pmPersonasAndSegments } from "./sections/pm-personas-and-segments"
import { pmPositioning } from "./sections/pm-positioning"
import { pmPricing } from "./sections/pm-pricing"
import { pmPrioritization } from "./sections/pm-prioritization"
import { pmProductLifecycle } from "./sections/pm-product-lifecycle"
import { pmProductMarketFit } from "./sections/pm-product-market-fit"
import { pmProductsAndModels } from "./sections/pm-products-and-models"
import { pmResponsibleProduct } from "./sections/pm-responsible-product"
import { pmRetention } from "./sections/pm-retention"
import { pmRoadmaps } from "./sections/pm-roadmaps"
import { pmStakeholders } from "./sections/pm-stakeholders"
import { pmTheRole } from "./sections/pm-the-role"
import { pmUnitEconomics } from "./sections/pm-unit-economics"
import { pmUserStories } from "./sections/pm-user-stories"
import { pmVisionAndStrategy } from "./sections/pm-vision-and-strategy"
import { pmVoiceOfCustomer } from "./sections/pm-voice-of-customer"
import { pmWritingSpecs } from "./sections/pm-writing-specs"

// Seven parts in the order a product actually moves: the job itself, then
// discovery before strategy (you cannot choose where to play without knowing
// the problem), then building, measuring, and taking it to market, and last the
// parts of the job that are about people. Intellipaat's course is the spine;
// primary sources fill in what a survey course skims. Section slugs are stable;
// do not rename them once progress exists.

export const part1: PartSeed = {
  slug: "part-1",
  title: "The job",
  description:
    "What a product manager is for, what a product is and how it earns, and the life every product lives from launch to retirement.",
  sections: [pmTheRole, pmProductsAndModels, pmProductLifecycle],
}

export const part2: PartSeed = {
  slug: "part-2",
  title: "Discovery",
  description:
    "Finding problems worth solving before building anything: talking to customers without being told polite lies, the job behind the purchase, the real problem under a request, and cheap ways to learn whether an idea has legs.",
  sections: [
    pmCustomerInterviews,
    pmJobsToBeDone,
    pmPersonasAndSegments,
    pmVoiceOfCustomer,
    pmMvpAndExperiments,
    pmProductMarketFit,
  ],
}

export const part3: PartSeed = {
  slug: "part-3",
  title: "Strategy",
  description:
    "Choosing where to play and how to win: vision and strategy, competitive advantage, reading competitors, where the next growth comes from, and how incumbents lose to cheaper upstarts.",
  sections: [
    pmVisionAndStrategy,
    pmCompetitiveAdvantage,
    pmCompetitiveAnalysis,
    pmGrowthStrategy,
    pmDisruption,
  ],
}

export const part4: PartSeed = {
  slug: "part-4",
  title: "Building",
  description:
    "From a chosen problem to shipped software: the classic development pipeline, prioritizing, the features that matter, specs and stories, design, roadmaps, and how delivery actually runs.",
  sections: [
    pmNewProductDevelopment,
    pmPrioritization,
    pmFeaturesAndValue,
    pmWritingSpecs,
    pmUserStories,
    pmDesignAndUsability,
    pmRoadmaps,
    pmAgileDelivery,
  ],
}

export const part5: PartSeed = {
  slug: "part-5",
  title: "Measuring",
  description:
    "Knowing whether any of it worked: metrics that move with value, retention and the economics behind it, experiments that establish cause, reading data without fooling yourself, and measuring the value customers feel.",
  sections: [
    pmMetrics,
    pmRetention,
    pmUnitEconomics,
    pmExperimentation,
    pmAnalytics,
    pmCustomerValue,
  ],
}

export const part6: PartSeed = {
  slug: "part-6",
  title: "Going to market",
  description:
    "Getting the product to the people it was built for: positioning and messaging, the go-to-market plan, pricing, launching safely, and growth that feeds itself.",
  sections: [pmPositioning, pmGtmStrategy, pmPricing, pmLaunching, pmGrowthLoops],
}

export const part7: PartSeed = {
  slug: "part-7",
  title: "The PM in the room",
  description:
    "The parts of the job that are about people and consequences: leading without authority, building responsibly, product management when the product is an AI model, and getting hired.",
  sections: [pmStakeholders, pmResponsibleProduct, pmAiProducts, pmCareer],
}
