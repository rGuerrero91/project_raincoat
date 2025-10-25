# Raincoat Demo - Design Expectations Document

## Overview

This document outlines design expectations for the Raincoat demo experience. The demo should showcase a privacy-first, AI-powered outfit recommendation app while guiding users through key features in a 3-5 minute journey.

## Design Philosophy

### Core Principles

**Privacy-First Transparency**
- Make local processing visible and celebrated, not hidden
- Use clear, jargon-free language about data handling
- Show processing happening on device with visual feedback

**Effortless Intelligence**
- AI works quietly in the background
- Results feel magical but not mysterious
- Clear explanations for recommendations without overwhelming

**Progressive Discovery**
- Introduce features naturally through use
- Avoid overwhelming with options upfront
- Let success in one area lead to the next

**Weather-Aware Context**
- Weather isn't just a data point, it's the story
- Connect outfit choices to real conditions
- Make recommendations feel personalized and timely

## Visual Design Guidelines

### Color Palette

**Primary Colors**
- Fresh Green: #e1f5e1 (trust, growth, eco-friendly)
- Sky Blue: #e3f2fd (clarity, calm, reliability)
- Warm Amber: #fff3e0 (processing, energy, activity)

**Accent Colors**
- Success Green: #c8e6c9
- Warning Orange: #f57c00
- Info Blue: #1976d2

**Neutrals**
- Dark Text: #212121
- Medium Gray: #757575
- Light Background: #fafafa
- White: #ffffff

### Typography

**Hierarchy**
- Headlines: Large (28-32px), medium weight, short phrases
- Subheadings: Medium (18-20px), regular weight
- Body Text: Standard (16px), readable line height (1.5-1.6)
- Captions: Small (12-14px), subtle color

**Tone**
- Friendly but not childish
- Clear but not clinical
- Confident but not pushy

### Spacing & Layout

**Grid System**
- Mobile-first design (320px minimum width)
- 16px base unit for spacing
- Generous padding around interactive elements (min 44px touch targets)

**Content Density**
- Avoid cluttered screens
- Maximum 3-4 primary actions per screen
- White space is your friend

## Screen-by-Screen Design Expectations

### 1. Welcome Screen

**Purpose**: Set expectations and create excitement

**Visual Elements**
- Hero image or illustration showing app concept
- App logo prominently displayed
- Single prominent CTA button

**Content**
- Headline: "Your Weather-Smart Wardrobe"
- Subheading: "AI-powered outfit recommendations that respect your privacy"
- CTA: "Start Demo"

**Design Notes**
- Keep it simple and inviting
- No navigation chrome (this is the entry point)
- Consider subtle animation on load

### 2. Privacy Promise Screen

**Purpose**: Build trust immediately by addressing privacy concerns

**Visual Elements**
- Lock icon or device illustration
- 3-point value proposition layout
- Clear visual hierarchy

**Content**
- Headline: "Your Photos Stay on Your Device"
- Bullet points:
  - "AI processes everything locally"
  - "Photos never leave your phone"
  - "Only text (tags) and AI metadata sent to cloud"
- CTA: "Got It" or "Continue"

**Design Notes**
- Use reassuring colors (blue/green)
- Consider iconography for each bullet
- Keep copy concise and scannable
- Optional "Learn More" link for details

### 3. Add Your First Item Screen

**Purpose**: Guide user to upload their first clothing item

**Visual Elements**
- Empty state illustration (empty closet or hanger)
- Large upload area/button
- Optional: Show example of what good photos look like

**Content**
- Headline: "Add Your First Item"
- Subheading: "Add a photo of a clothing item, it can be the piece by itself or a selfie (photos don't get uploaded anywhere)"
- CTA: "Upload Photo"
- Helper text: "Pro tip: Use good lighting and a simple background"

**Design Notes**
- Make the upload action obvious and inviting
- Show it's safe (reinforce local processing)
- Consider showing sample "before/after" if space allows

### 4. Photo Source Selection

**Purpose**: Standard OS-level picker

**Options**
- Take Photo
- Choose from Library
- Cancel

**Design Notes**
- Use native iOS/Android patterns
- No custom design needed here

### 5 Category Selector
**Purpose**: Allow the user to indicate the general category of the item in the image in order to auto crop the item. Also allows the selection of a specific itme if more than one is present.

**Content**
- Headline: "Category"
- Subheading: "If more than one item is present, this will focus in on the closest match."

**Options**:
- "TOP" button
- "BOTTOM" button
- "ACCESSORY" button
- "SHOES" button
- "OUTERWEAR" button

**Design Notes**
- Display all buttons, but grey out any corresponding to item categories that aren't detected by YOLO

### 6. Client-Side Processing Screen

**Purpose**: Show AI working locally, build anticipation

**Visual Elements**
- Processing indicator (spinner or progress bar)
- Step-by-step status updates
- Thumbnail of uploaded photo

**Content**
- Headline: "Processing Locally..."
- Sequential steps:
  1. "Removing background"
  2. "Analyzing item"
  3. "Generating tags"
- Estimated time: "About 3-4 seconds"

**Design Notes**
- Use warm processing color (amber/orange)
- Animate transitions between steps
- Show progress, not just a spinner
- Consider showing the background removal visually
- Reinforce "on your device" messaging

### 7. Auto-Tags Displayed

**Purpose**: Show AI results, allow validation

**Visual Elements**
- Processed image (background removed)
- Tag chips/badges displayed prominently
- Edit and Confirm actions

**Content**
- Headline: "How does this look?"
- Subheading: "Suggested tags:"
- Tags displayed as chips: "red dress", "casual", "summer", "cotton"
- "x" on tags allows quick removal
- Two CTAs: "Edit Tags" (secondary), "Looks Good" (primary)

**Design Notes**
- Show confidence in AI with primary "approve" action
- Make editing feel easy, not required
- Use color-coded tags if relevant (category, color, season)
- Show processed image prominently
- Consider slight animation when tags appear

### 8. Edit Tag Sheet (Modal/Bottom Sheet)

**Purpose**: Allow manual tag adjustment

**Visual Elements**
- Modal or bottom sheet overlay
- Existing tags (removable)
- Suggested additional tags
- Free-form input for custom tags

**Content**
- Headline: "Edit Tags"
- Sections:
  - "Current Tags" (with X to remove)
  - "Add More" (suggested tags)
  - "Custom Tag" (text input)
- CTAs: "Cancel", "Save Changes"

**Design Notes**
- Make removal obvious (X or swipe)
- Suggest common tags user might want
- Allow keyboard input for power users
- Save button should be prominent when changes made

### 9. Saving Item Screen

**Purpose**: Provide feedback that action completed

**Visual Elements**
- Brief loading state
- Success confirmation

**Content**
- Brief message: "Adding to your closet..."
- Then: "Item added!"

**Design Notes**
- Keep this quick (1-2 seconds max)
- Use success color (green)
- Consider simple closet animation

### 10. Quick Add Pre-Loaded Items

**Purpose**: Skip repetitive uploads for demo flow

**Visual Elements**
- 2-3 item cards with photos
- "Skip" or "Add to Closet" option per item
- Progress indicator (2 of 3 complete)

**Content**
- Headline: "Let's add a few more items"
- Subheading: "We'll use some examples to speed things up"
- Per item: Photo + basic description
- CTAs: "Add All" (primary), "Add Another Photo" (secondary)

**Design Notes**
- Make it clear this is for demo convenience
- Show variety in clothing types
- Keep momentum high - no more than 2 screens
- Allow skipping entirely

### 11. Your Closet Screen

**Purpose**: Show organized collection, provide navigation

**Visual Elements**
- Grid layout of clothing items
- Each item shows photo + key tags
- Prominent CTA for next action
- Navigation elements

**Content**
- Headline: "Your Closet"
- Item count: "5 items"
- Grid of items (2-3 columns)
- Prominent CTA: "Get Outfit Ideas"
- Secondary actions: "Add Item", "Collections"

**Design Notes**
- Clean grid with consistent spacing
- Tappable cards with subtle shadow/border
- Tags visible but not overwhelming
- Make "Get Outfit Ideas" the obvious next step
- Consider filter/sort options (but keep simple)

### 12. Location Input

**Purpose**: User enters City for weather data

**Visual Elements**
- Text / selection field
- Clear explanation of why
- Two clear options

**Content**
- Headline: "What's the weather like?"
- Body: "Select your city so we can give you outfit ideas depending on the weather."
- Subheading: We only need the city, nothing specific since we aren't selling your data.
- CTAs: "Set City"
- Optional: "Skip for now"

**Design Notes**
- Clearly explain the value exchange
- Make manual entry easy (not a punishment)
- Use weather iconography
- Consider showing example: "San Francisco, 68°F"


### 13. Weather Context Screen

**Purpose**: Show weather data as context for recommendations

**Visual Elements**
- Large weather icon/illustration
- Temperature and conditions
- Location name
- Transition to recommendations

**Content**
- Location: "San Francisco, CA"
- Temperature: "68°F"
- Conditions: "Partly Cloudy"
- Additional: "Light breeze, low humidity"
- Auto-advancing text: "Finding perfect outfits..."

**Design Notes**
- Use weather-appropriate visuals
- Make data scannable
- Brief pause (2-3 seconds) before auto-advancing
- Use weather colors (sunny = warm, cloudy = cool)
- Consider animated weather icons

### 14. Outfit Recommendations Screen

**Purpose**: Show AI-generated outfit suggestions

**Visual Elements**
- 3 outfit cards in scrollable list
- Each card shows:
  - Thumbnail images of items
  - Outfit name
  - Item count
  - Brief reason why
- Tappable cards

**Content**
- Headline: "Perfect for Today"
- Subheading: "68°F, Partly Cloudy"
- Three outfit cards:
  1. "Smart Casual" - 3 items - "Polished but comfortable"
  2. "Comfortable Day" - 4 items - "Relaxed and practical"
  3. "Evening Ready" - 3 items - "Elevated and stylish"

**Design Notes**
- Clear visual hierarchy between outfits
- Show actual clothing images (not icons)
- Make tapping obvious with card design
- Consider subtle rating or match percentage
- Swipeable or scrollable list
- Keep reasons brief (1 line max)

### 15. Outfit Detail Screen

**Purpose**: Show complete outfit with rationale

**Visual Elements**
- Hero area with outfit visualization
- List of items by category
- Explanation section
- Action buttons at bottom

**Content**
- Outfit name: "Smart Casual"
- Item breakdown:
  - Top: Red dress
  - Shoes: White sneakers
  - Accessories: Sunglasses
- "Why this works:" section:
  - "Perfect for 68°F weather"
  - "Casual but polished"
  - "Versatile for multiple occasions"
- CTAs: "Save Outfit", "Find Similar", "Back"

**Design Notes**
- Show items large enough to see details
- Group by category (top, bottom, accessories, etc.)
- Make the "why" compelling but brief
- Multiple CTAs but clear hierarchy
- Consider layout visualization (mannequin or flat lay)

### 16. Similar Items Screen

**Purpose**: Demonstrate AI similarity search

**Visual Elements**
- Original item at top
- Similar items in grid below
- Match percentage badges

**Content**
- Headline: "Similar to Red Dress"
- Original item card
- Grid of similar items:
  - Pink sundress (95% match)
  - Coral maxi dress (89% match)
  - Red blouse (82% match)
- Subheading: "Based on AI analysis of style, color, and fit"

**Design Notes**
- Show similarity visually (colors, styles actually look similar)
- Use percentage or star rating
- Make tapping items obvious
- Explain "AI embeddings" in simple terms
- Back navigation clear

### 17. Collections Screen

**Purpose**: Show organization system

**Visual Elements**
- List or grid of collections
- Each collection shows:
  - Collection name
  - Item count
  - Preview thumbnails (if items exist)
- Create new collection option

**Content**
- Headline: "Your Collections"
- Default collections:
  - All Items (5)
  - Work (0)
  - Casual (3)
  - Travel (0)
- CTA: "+ Create Collection"

**Design Notes**
- Show empty states gracefully
- Make item counts prominent
- Preview images make non-empty collections enticing
- Clear create action
- Consider drag-and-drop hints

### 18. Collection Detail Screen

**Purpose**: Show and manage collection contents

**Visual Elements**
- Collection name at top
- Grid of items in collection
- Add items interface

**Content**
- Collection name: "Casual"
- Item grid (3 items)
- CTA: "Add Items"
- Hint: "Drag items here or tap to add"

**Design Notes**
- Similar to main closet view
- Make adding items intuitive
- Show empty state if no items
- Allow removal from collection
- Consider multi-select mode

### 19. Demo Complete Screen

**Purpose**: Celebrate completion

**Visual Elements**
- Success/completion graphic
- Checklist of features experienced
- Strong CTA section

**Content**
- Headline: "That's a Raincoat!"
- Checklist:
  - Privacy-first photo processing
  - AI-powered auto-tagging
  - Weather-based recommendations
  - Smart outfit creation
  - Closet organization
- CTAs:
  - "Restart Demo" (secondary)
  - "Learn More" (tertiary)

**Design Notes**
- Celebratory tone
- Use success color (green)
- Make signup CTA prominent
- Show value delivered
- Consider animation or confetti
- Make restart easy (some want to explore more)

## Interaction Patterns

### Transitions

**Between Screens**
- Smooth, natural transitions (300-400ms)
- Directional (forward/back should feel different)
- Avoid jarring cuts

**Loading States**
- Always show progress, never leave user wondering
- Use skeleton screens for content loading
- Spinners for quick actions (< 2 seconds)
- Progress bars for longer processes (> 2 seconds)

### Gestures

**Primary Actions**
- Tap: Main interaction method
- Swipe: Navigate between similar items (outfits, recommendations)
- Long press: Optional for advanced actions (not required in demo)

**Navigation**
- Back button/gesture always available
- Breadcrumbs for deep navigation
- Home/main nav accessible from key screens

### Feedback

**Haptics**
- Success actions (item saved, outfit created)
- Important warnings (error states)
- Don't overuse

**Animations**
- Micro-animations for state changes
- Skeleton screens for loading
- Success celebrations (checkmarks, brief confetti)
- Keep performant (no janky animations)

## Copy & Messaging Guidelines

### Voice & Tone

**Friendly Expert**
- Knowledgeable but not pretentious
- Helpful but not hand-holdy
- Confident but not pushy

**Examples**
- Good: "Perfect for today's weather"
- Bad: "Our advanced AI algorithm has determined..."
- Good: "Let's add your first item"
- Bad: "Upload image to initialize wardrobe database"

### Privacy Messaging

**Be Direct**
- "Photos stay on your device" (not "We value your privacy")
- "AI processes locally" (not "Secure processing")
- Show, don't just tell

**When to Reinforce**
- Initial privacy screen (prominent)
- During photo processing (subtle reminder)
- Settings/about section (detailed explanation)

### Error Messages

**Be Helpful**
- Explain what went wrong
- Suggest how to fix it
- Maintain friendly tone even in errors

**Examples**
- "Couldn't process that photo. Try one with better lighting?"
- "Lost connection. Tap to try again."
- "That didn't work. Let's try a different photo."

## Technical Constraints

### Performance

**Loading Times**
- Background removal: 2-3 seconds
- Embedding generation: 1-2 seconds
- Total processing: 3-4 seconds maximum
- Weather fetch: < 1 second

**Model Sizes**
- U2-Net: ~167 MB (loaded once)
- FashionCLIP: ~150 MB (loaded once)
- First load will be slower, subsequent fast

### Browser Considerations

**WebGPU/WASM**
- Provide fallback messaging if unsupported
- Graceful degradation to slower processing
- Never fail completely

**Storage**
- IndexedDB for model caching
- LocalStorage for preferences
- No server uploads of photos

### Platform Support

**Minimum Requirements**
- iOS 14+ / Android 8+
- Modern browsers (Chrome, Safari, Firefox, Edge)
- 2GB+ RAM recommended

## Accessibility Requirements

### Screen Readers

**ARIA Labels**
- All interactive elements labeled
- State changes announced
- Image descriptions provided

**Focus Management**
- Logical tab order
- Focus trapped in modals
- Skip links for navigation

### Visual

**Contrast Ratios**
- Text: minimum 4.5:1
- Large text: minimum 3:1
- Interactive elements: clear boundaries

**Text Sizing**
- Respect system font size settings
- Support up to 200% zoom
- No fixed pixel heights for text containers

### Motor

**Touch Targets**
- Minimum 44x44px
- Adequate spacing between elements
- Support keyboard navigation

## Edge Cases & Error States

### Photo Processing Failures

**Scenario**: AI model fails to process photo

**Design Solution**
- Show friendly error message
- Offer retry option
- Allow manual tagging as fallback
- Log error for debugging (privacy-safe)

### Network Issues

**Scenario**: Can't fetch weather data

**Design Solution**
- Show cached weather if available
- Allow manual weather input
- Provide demo mode with sample data
- Clear messaging about offline state

### Empty States

**Scenario**: User has no items in closet

**Design Solution**
- Encouraging illustration
- Clear CTA to add first item
- Show value proposition
- Example/tutorial option

### No Recommendations Available

**Scenario**: Not enough items for outfit

**Design Solution**
- Explain minimum needed (e.g., "Add 3 more items for outfit suggestions")
- Show progress toward minimum
- Offer to add more items
- Provide examples of what to add

## Mobile-Specific Considerations

### Portrait vs Landscape

**Primary Support**: Portrait
**Secondary Support**: Landscape (should work, may not be optimized)

### Safe Areas

**iOS Notch/Dynamic Island**
- Respect safe area insets
- No critical content in notch area
- Background extends to edges

**Android Navigation**
- Respect gesture areas
- No overlapping bottom nav
- Clear space for system buttons

### Camera/Photo Library

**Permissions**
- Request at moment of need
- Clear explanation before system prompt
- Handle denial gracefully

## Success Metrics

### Demo Completion

**Goal**: 70%+ users complete full flow

**Key Drops**
- After privacy screen (expected 10-15%)
- During photo upload (expected 5-10%)
- After first outfit recommendation (expected 5%)

### Engagement Signals

**Positive Indicators**
- User edits AI tags (shows engagement)
- User saves outfits (shows value)
- User explores similar items (shows discovery)
- User creates account (conversion)

### Time to Value

**Target**: Under 90 seconds to first recommendation

**Milestones**
- Photo uploaded: 0-20 seconds
- Processing complete: 20-25 seconds
- Tags confirmed: 25-40 seconds
- Closet populated: 40-60 seconds
- Weather fetched: 60-70 seconds
- Recommendations shown: 70-90 seconds

## Design Deliverables Expected

### High Priority

1. **Complete Screen Designs**
   - All 19 screens in high fidelity
   - Mobile-first (375px width primary)
   - Light mode (dark mode optional)

2. **Key Interaction States**
   - Default, hover, active, disabled
   - Loading/processing states
   - Error states
   - Empty states

3. **Component Library**
   - Buttons (primary, secondary, tertiary)
   - Cards (clothing item, outfit, collection)
   - Tags/chips
   - Input fields
   - Modals/sheets

### Medium Priority

4. **Prototype/Flow**
   - Clickable prototype in Figma
   - Key transitions animated
   - Demo script included

5. **Responsive Considerations**
   - Tablet view (optional)
   - Small phone (320px) considerations
   - Large phone (428px) optimizations

### Lower Priority

6. **Additional States**
   - Dark mode
   - Accessibility variations
   - Localization considerations

7. **Marketing Assets**
   - App icon concepts
   - Splash screen
   - Feature graphics

## Questions for Designer

Before starting, please clarify:

1. **Branding**: Do we have existing brand guidelines, or are you creating from scratch?
2. **Icons**: Should we use an icon library (e.g., Heroicons, Feather) or custom icons?
3. **Illustrations**: What style - abstract, flat, realistic, or mixed?
4. **Photography**: Do we need stock photos for demo clothing items?
5. **Timeline**: What's the expected turnaround for each phase?
6. **Format**: Figma preferred? Other tools acceptable?

## References & Inspiration

### Similar Apps (for reference)
- Cladwell (outfit planning)
- Stylebook (closet organization)
- WHERING (sustainable fashion)
- Acloset (AI outfit suggestions)

### Design Systems to Consider
- Material Design (Android)
- Human Interface Guidelines (iOS)
- Tailwind UI components
- Radix UI primitives

### Key Differentiators to Emphasize
- Privacy-first (photos never leave device)
- Weather integration (not just fashion)
- ML processing (but make it feel natural)
- Speed (3-4 seconds, not minutes)

---

**Document Version**: 1.0  
**Last Updated**: October 25, 2025  
**For Questions**: Text me lol
