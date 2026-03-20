;(function () {
  const env = { DEBUG: true }
  try {
    if (process) {
      process.env = Object.assign({}, process.env)
      Object.assign(process.env, env)
      return
    }
  } catch (e) {} // avoid ReferenceError: process is not defined
  globalThis.process = { env: env }
})()

var name = 'simple-thermostat-refresh'
var version = '2.2.2'

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill =
  typeof window !== 'undefined' &&
  window.customElements != null &&
  window.customElements.polyfillWrapFlushCallback !== undefined
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
const removeNodes = (container, start, end = null) => {
  while (start !== end) {
    const n = start.nextSibling
    container.removeChild(start)
    start = n
  }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`
const markerRegex = new RegExp(`${marker}|${nodeMarker}`)
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$'
/**
 * An updatable Template that tracks the location of dynamic parts.
 */
class Template {
  constructor(result, element) {
    this.parts = []
    this.element = element
    const nodesToRemove = []
    const stack = []
    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
      element.content,
      133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */,
      null,
      false
    )
    // Keeps track of the last index associated with a part. We try to delete
    // unnecessary nodes, but we never want to associate two different parts
    // to the same index. They must have a constant node between.
    let lastPartIndex = 0
    let index = -1
    let partIndex = 0
    const {
      strings,
      values: { length },
    } = result
    while (partIndex < length) {
      const node = walker.nextNode()
      if (node === null) {
        // We've exhausted the content inside a nested template element.
        // Because we still have parts (the outer for-loop), we know:
        // - There is a template in the stack
        // - The walker will find a nextNode outside the template
        walker.currentNode = stack.pop()
        continue
      }
      index++
      if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
        if (node.hasAttributes()) {
          const attributes = node.attributes
          const { length } = attributes
          // Per
          // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
          // attributes are not guaranteed to be returned in document order.
          // In particular, Edge/IE can return them out of order, so we cannot
          // assume a correspondence between part index and attribute index.
          let count = 0
          for (let i = 0; i < length; i++) {
            if (endsWith(attributes[i].name, boundAttributeSuffix)) {
              count++
            }
          }
          while (count-- > 0) {
            // Get the template literal section leading up to the first
            // expression in this attribute
            const stringForPart = strings[partIndex]
            // Find the attribute name
            const name = lastAttributeNameRegex.exec(stringForPart)[2]
            // Find the corresponding attribute
            // All bound attributes have had a suffix added in
            // TemplateResult#getHTML to opt out of special attribute
            // handling. To look up the attribute value we also need to add
            // the suffix.
            const attributeLookupName =
              name.toLowerCase() + boundAttributeSuffix
            const attributeValue = node.getAttribute(attributeLookupName)
            node.removeAttribute(attributeLookupName)
            const statics = attributeValue.split(markerRegex)
            this.parts.push({
              type: 'attribute',
              index,
              name,
              strings: statics,
            })
            partIndex += statics.length - 1
          }
        }
        if (node.tagName === 'TEMPLATE') {
          stack.push(node)
          walker.currentNode = node.content
        }
      } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const data = node.data
        if (data.indexOf(marker) >= 0) {
          const parent = node.parentNode
          const strings = data.split(markerRegex)
          const lastIndex = strings.length - 1
          // Generate a new text node for each literal section
          // These nodes are also used as the markers for node parts
          for (let i = 0; i < lastIndex; i++) {
            let insert
            let s = strings[i]
            if (s === '') {
              insert = createMarker()
            } else {
              const match = lastAttributeNameRegex.exec(s)
              if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                s =
                  s.slice(0, match.index) +
                  match[1] +
                  match[2].slice(0, -boundAttributeSuffix.length) +
                  match[3]
              }
              insert = document.createTextNode(s)
            }
            parent.insertBefore(insert, node)
            this.parts.push({ type: 'node', index: ++index })
          }
          // If there's no text, we must insert a comment to mark our place.
          // Else, we can trust it will stick around after cloning.
          if (strings[lastIndex] === '') {
            parent.insertBefore(createMarker(), node)
            nodesToRemove.push(node)
          } else {
            node.data = strings[lastIndex]
          }
          // We have a part for each match found
          partIndex += lastIndex
        }
      } else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
        if (node.data === marker) {
          const parent = node.parentNode
          // Add a new marker node to be the startNode of the Part if any of
          // the following are true:
          //  * We don't have a previousSibling
          //  * The previousSibling is already the start of a previous part
          if (node.previousSibling === null || index === lastPartIndex) {
            index++
            parent.insertBefore(createMarker(), node)
          }
          lastPartIndex = index
          this.parts.push({ type: 'node', index })
          // If we don't have a nextSibling, keep this node so we have an end.
          // Else, we can remove it to save future costs.
          if (node.nextSibling === null) {
            node.data = ''
          } else {
            nodesToRemove.push(node)
            index--
          }
          partIndex++
        } else {
          let i = -1
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            // Comment node has a binding marker inside, make an inactive part
            // The binding won't work, but subsequent bindings will
            // TODO (justinfagnani): consider whether it's even worth it to
            // make bindings in comments work
            this.parts.push({ type: 'node', index: -1 })
            partIndex++
          }
        }
      }
    }
    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode.removeChild(n)
    }
  }
}
const endsWith = (str, suffix) => {
  const index = str.length - suffix.length
  return index >= 0 && str.slice(index) === suffix
}
const isTemplatePartActive = (part) => part.index !== -1
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('')
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex =
  // eslint-disable-next-line no-control-regex
  /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/

const walkerNodeFilter = 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
/**
 * Removes the list of nodes from a Template safely. In addition to removing
 * nodes from the Template, the Template part indices are updated to match
 * the mutated Template DOM.
 *
 * As the template is walked the removal state is tracked and
 * part indices are adjusted as needed.
 *
 * div
 *   div#1 (remove) <-- start removing (removing node is div#1)
 *     div
 *       div#2 (remove)  <-- continue removing (removing node is still div#1)
 *         div
 * div <-- stop removing since previous sibling is the removing node (div#1,
 * removed 4 nodes)
 */
function removeNodesFromTemplate(template, nodesToRemove) {
  const {
    element: { content },
    parts,
  } = template
  const walker = document.createTreeWalker(
    content,
    walkerNodeFilter,
    null,
    false
  )
  let partIndex = nextActiveIndexInTemplateParts(parts)
  let part = parts[partIndex]
  let nodeIndex = -1
  let removeCount = 0
  const nodesToRemoveInTemplate = []
  let currentRemovingNode = null
  while (walker.nextNode()) {
    nodeIndex++
    const node = walker.currentNode
    // End removal if stepped past the removing node
    if (node.previousSibling === currentRemovingNode) {
      currentRemovingNode = null
    }
    // A node to remove was found in the template
    if (nodesToRemove.has(node)) {
      nodesToRemoveInTemplate.push(node)
      // Track node we're removing
      if (currentRemovingNode === null) {
        currentRemovingNode = node
      }
    }
    // When removing, increment count by which to adjust subsequent part indices
    if (currentRemovingNode !== null) {
      removeCount++
    }
    while (part !== undefined && part.index === nodeIndex) {
      // If part is in a removed node deactivate it by setting index to -1 or
      // adjust the index as needed.
      part.index = currentRemovingNode !== null ? -1 : part.index - removeCount
      // go to the next active part.
      partIndex = nextActiveIndexInTemplateParts(parts, partIndex)
      part = parts[partIndex]
    }
  }
  nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n))
}
const countNodes = (node) => {
  let count = node.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */ ? 0 : 1
  const walker = document.createTreeWalker(node, walkerNodeFilter, null, false)
  while (walker.nextNode()) {
    count++
  }
  return count
}
const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
  for (let i = startIndex + 1; i < parts.length; i++) {
    const part = parts[i]
    if (isTemplatePartActive(part)) {
      return i
    }
  }
  return -1
}
/**
 * Inserts the given node into the Template, optionally before the given
 * refNode. In addition to inserting the node into the Template, the Template
 * part indices are updated to match the mutated Template DOM.
 */
function insertNodeIntoTemplate(template, node, refNode = null) {
  const {
    element: { content },
    parts,
  } = template
  // If there's no refNode, then put node at end of template.
  // No part indices need to be shifted in this case.
  if (refNode === null || refNode === undefined) {
    content.appendChild(node)
    return
  }
  const walker = document.createTreeWalker(
    content,
    walkerNodeFilter,
    null,
    false
  )
  let partIndex = nextActiveIndexInTemplateParts(parts)
  let insertCount = 0
  let walkerIndex = -1
  while (walker.nextNode()) {
    walkerIndex++
    const walkerNode = walker.currentNode
    if (walkerNode === refNode) {
      insertCount = countNodes(node)
      refNode.parentNode.insertBefore(node, refNode)
    }
    while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
      // If we've inserted the node, simply adjust all subsequent parts
      if (insertCount > 0) {
        while (partIndex !== -1) {
          parts[partIndex].index += insertCount
          partIndex = nextActiveIndexInTemplateParts(parts, partIndex)
        }
        return
      }
      partIndex = nextActiveIndexInTemplateParts(parts, partIndex)
    }
  }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap()
/**
 * Brands a function as a directive factory function so that lit-html will call
 * the function during template rendering, rather than passing as a value.
 *
 * A _directive_ is a function that takes a Part as an argument. It has the
 * signature: `(part: Part) => void`.
 *
 * A directive _factory_ is a function that takes arguments for data and
 * configuration and returns a directive. Users of directive usually refer to
 * the directive factory as the directive. For example, "The repeat directive".
 *
 * Usually a template author will invoke a directive factory in their template
 * with relevant arguments, which will then return a directive function.
 *
 * Here's an example of using the `repeat()` directive factory that takes an
 * array and a function to render an item:
 *
 * ```js
 * html`<ul><${repeat(items, (item) => html`<li>${item}</li>`)}</ul>`
 * ```
 *
 * When `repeat` is invoked, it returns a directive function that closes over
 * `items` and the template function. When the outer template is rendered, the
 * return directive function is called with the Part for the expression.
 * `repeat` then performs it's custom logic to render multiple items.
 *
 * @param f The directive factory function. Must be a function that returns a
 * function of the signature `(part: Part) => void`. The returned function will
 * be called with the part object.
 *
 * @example
 *
 * import {directive, html} from 'lit-html';
 *
 * const immutable = directive((v) => (part) => {
 *   if (part.value !== v) {
 *     part.setValue(v)
 *   }
 * });
 */
const directive = (f) => (...args) => {
  const d = f(...args)
  directives.set(d, true)
  return d
}
const isDirective = (o) => {
  return typeof o === 'function' && directives.has(o)
}

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {}
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {}

/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
  constructor(template, processor, options) {
    this.__parts = []
    this.template = template
    this.processor = processor
    this.options = options
  }
  update(values) {
    let i = 0
    for (const part of this.__parts) {
      if (part !== undefined) {
        part.setValue(values[i])
      }
      i++
    }
    for (const part of this.__parts) {
      if (part !== undefined) {
        part.commit()
      }
    }
  }
  _clone() {
    // There are a number of steps in the lifecycle of a template instance's
    // DOM fragment:
    //  1. Clone - create the instance fragment
    //  2. Adopt - adopt into the main document
    //  3. Process - find part markers and create parts
    //  4. Upgrade - upgrade custom elements
    //  5. Update - set node, attribute, property, etc., values
    //  6. Connect - connect to the document. Optional and outside of this
    //     method.
    //
    // We have a few constraints on the ordering of these steps:
    //  * We need to upgrade before updating, so that property values will pass
    //    through any property setters.
    //  * We would like to process before upgrading so that we're sure that the
    //    cloned fragment is inert and not disturbed by self-modifying DOM.
    //  * We want custom elements to upgrade even in disconnected fragments.
    //
    // Given these constraints, with full custom elements support we would
    // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
    //
    // But Safari does not implement CustomElementRegistry#upgrade, so we
    // can not implement that order and still have upgrade-before-update and
    // upgrade disconnected fragments. So we instead sacrifice the
    // process-before-upgrade constraint, since in Custom Elements v1 elements
    // must not modify their light DOM in the constructor. We still have issues
    // when co-existing with CEv0 elements like Polymer 1, and with polyfills
    // that don't strictly adhere to the no-modification rule because shadow
    // DOM, which may be created in the constructor, is emulated by being placed
    // in the light DOM.
    //
    // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
    // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
    // in one step.
    //
    // The Custom Elements v1 polyfill supports upgrade(), so the order when
    // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
    // Connect.
    const fragment = isCEPolyfill
      ? this.template.element.content.cloneNode(true)
      : document.importNode(this.template.element.content, true)
    const stack = []
    const parts = this.template.parts
    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
      fragment,
      133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */,
      null,
      false
    )
    let partIndex = 0
    let nodeIndex = 0
    let part
    let node = walker.nextNode()
    // Loop through all the nodes and parts of a template
    while (partIndex < parts.length) {
      part = parts[partIndex]
      if (!isTemplatePartActive(part)) {
        this.__parts.push(undefined)
        partIndex++
        continue
      }
      // Progress the tree walker until we find our next part's node.
      // Note that multiple parts may share the same node (attribute parts
      // on a single element), so this loop may not run at all.
      while (nodeIndex < part.index) {
        nodeIndex++
        if (node.nodeName === 'TEMPLATE') {
          stack.push(node)
          walker.currentNode = node.content
        }
        if ((node = walker.nextNode()) === null) {
          // We've exhausted the content inside a nested template element.
          // Because we still have parts (the outer for-loop), we know:
          // - There is a template in the stack
          // - The walker will find a nextNode outside the template
          walker.currentNode = stack.pop()
          node = walker.nextNode()
        }
      }
      // We've arrived at our part's node.
      if (part.type === 'node') {
        const part = this.processor.handleTextExpression(this.options)
        part.insertAfterNode(node.previousSibling)
        this.__parts.push(part)
      } else {
        this.__parts.push(
          ...this.processor.handleAttributeExpressions(
            node,
            part.name,
            part.strings,
            this.options
          )
        )
      }
      partIndex++
    }
    if (isCEPolyfill) {
      document.adoptNode(fragment)
      customElements.upgrade(fragment)
    }
    return fragment
  }
}

/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy =
  window.trustedTypes &&
  trustedTypes.createPolicy('lit-html', { createHTML: (s) => s })
const commentMarker = ` ${marker} `
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
  constructor(strings, values, type, processor) {
    this.strings = strings
    this.values = values
    this.type = type
    this.processor = processor
  }
  /**
   * Returns a string of HTML used to create a `<template>` element.
   */
  getHTML() {
    const l = this.strings.length - 1
    let html = ''
    let isCommentBinding = false
    for (let i = 0; i < l; i++) {
      const s = this.strings[i]
      // For each binding we want to determine the kind of marker to insert
      // into the template source before it's parsed by the browser's HTML
      // parser. The marker type is based on whether the expression is in an
      // attribute, text, or comment position.
      //   * For node-position bindings we insert a comment with the marker
      //     sentinel as its text content, like <!--{{lit-guid}}-->.
      //   * For attribute bindings we insert just the marker sentinel for the
      //     first binding, so that we support unquoted attribute bindings.
      //     Subsequent bindings can use a comment marker because multi-binding
      //     attributes must be quoted.
      //   * For comment bindings we insert just the marker sentinel so we don't
      //     close the comment.
      //
      // The following code scans the template source, but is *not* an HTML
      // parser. We don't need to track the tree structure of the HTML, only
      // whether a binding is inside a comment, and if not, if it appears to be
      // the first binding in an attribute.
      const commentOpen = s.lastIndexOf('<!--')
      // We're in comment position if we have a comment open with no following
      // comment close. Because <-- can appear in an attribute value there can
      // be false positives.
      isCommentBinding =
        (commentOpen > -1 || isCommentBinding) &&
        s.indexOf('-->', commentOpen + 1) === -1
      // Check to see if we have an attribute-like sequence preceding the
      // expression. This can match "name=value" like structures in text,
      // comments, and attribute values, so there can be false-positives.
      const attributeMatch = lastAttributeNameRegex.exec(s)
      if (attributeMatch === null) {
        // We're only in this branch if we don't have a attribute-like
        // preceding sequence. For comments, this guards against unusual
        // attribute values like <div foo="<!--${'bar'}">. Cases like
        // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
        // below.
        html += s + (isCommentBinding ? commentMarker : nodeMarker)
      } else {
        // For attributes we use just a marker sentinel, and also append a
        // $lit$ suffix to the name to opt-out of attribute-specific parsing
        // that IE and Edge do for style and certain SVG attributes.
        html +=
          s.substr(0, attributeMatch.index) +
          attributeMatch[1] +
          attributeMatch[2] +
          boundAttributeSuffix +
          attributeMatch[3] +
          marker
      }
    }
    html += this.strings[l]
    return html
  }
  getTemplateElement() {
    const template = document.createElement('template')
    let value = this.getHTML()
    if (policy !== undefined) {
      // this is secure because `this.strings` is a TemplateStringsArray.
      // TODO: validate this when
      // https://github.com/tc39/proposal-array-is-template-object is
      // implemented.
      value = policy.createHTML(value)
    }
    template.innerHTML = value
    return template
  }
}

const isPrimitive = (value) => {
  return (
    value === null ||
    !(typeof value === 'object' || typeof value === 'function')
  )
}
const isIterable = (value) => {
  return (
    Array.isArray(value) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(value && value[Symbol.iterator])
  )
}
/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attribute. The value is only set once even if there are multiple parts
 * for an attribute.
 */
class AttributeCommitter {
  constructor(element, name, strings) {
    this.dirty = true
    this.element = element
    this.name = name
    this.strings = strings
    this.parts = []
    for (let i = 0; i < strings.length - 1; i++) {
      this.parts[i] = this._createPart()
    }
  }
  /**
   * Creates a single part. Override this to create a differnt type of part.
   */
  _createPart() {
    return new AttributePart(this)
  }
  _getValue() {
    const strings = this.strings
    const l = strings.length - 1
    const parts = this.parts
    // If we're assigning an attribute via syntax like:
    //    attr="${foo}"  or  attr=${foo}
    // but not
    //    attr="${foo} ${bar}" or attr="${foo} baz"
    // then we don't want to coerce the attribute value into one long
    // string. Instead we want to just return the value itself directly,
    // so that sanitizeDOMValue can get the actual value rather than
    // String(value)
    // The exception is if v is an array, in which case we do want to smash
    // it together into a string without calling String() on the array.
    //
    // This also allows trusted values (when using TrustedTypes) being
    // assigned to DOM sinks without being stringified in the process.
    if (l === 1 && strings[0] === '' && strings[1] === '') {
      const v = parts[0].value
      if (typeof v === 'symbol') {
        return String(v)
      }
      if (typeof v === 'string' || !isIterable(v)) {
        return v
      }
    }
    let text = ''
    for (let i = 0; i < l; i++) {
      text += strings[i]
      const part = parts[i]
      if (part !== undefined) {
        const v = part.value
        if (isPrimitive(v) || !isIterable(v)) {
          text += typeof v === 'string' ? v : String(v)
        } else {
          for (const t of v) {
            text += typeof t === 'string' ? t : String(t)
          }
        }
      }
    }
    text += strings[l]
    return text
  }
  commit() {
    if (this.dirty) {
      this.dirty = false
      this.element.setAttribute(this.name, this._getValue())
    }
  }
}
/**
 * A Part that controls all or part of an attribute value.
 */
class AttributePart {
  constructor(committer) {
    this.value = undefined
    this.committer = committer
  }
  setValue(value) {
    if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
      this.value = value
      // If the value is a not a directive, dirty the committer so that it'll
      // call setAttribute. If the value is a directive, it'll dirty the
      // committer if it calls setValue().
      if (!isDirective(value)) {
        this.committer.dirty = true
      }
    }
  }
  commit() {
    while (isDirective(this.value)) {
      const directive = this.value
      this.value = noChange
      directive(this)
    }
    if (this.value === noChange) {
      return
    }
    this.committer.commit()
  }
}
/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */
class NodePart {
  constructor(options) {
    this.value = undefined
    this.__pendingValue = undefined
    this.options = options
  }
  /**
   * Appends this part into a container.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  appendInto(container) {
    this.startNode = container.appendChild(createMarker())
    this.endNode = container.appendChild(createMarker())
  }
  /**
   * Inserts this part after the `ref` node (between `ref` and `ref`'s next
   * sibling). Both `ref` and its next sibling must be static, unchanging nodes
   * such as those that appear in a literal section of a template.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterNode(ref) {
    this.startNode = ref
    this.endNode = ref.nextSibling
  }
  /**
   * Appends this part into a parent part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  appendIntoPart(part) {
    part.__insert((this.startNode = createMarker()))
    part.__insert((this.endNode = createMarker()))
  }
  /**
   * Inserts this part after the `ref` part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterPart(ref) {
    ref.__insert((this.startNode = createMarker()))
    this.endNode = ref.endNode
    ref.endNode = this.startNode
  }
  setValue(value) {
    this.__pendingValue = value
  }
  commit() {
    if (this.startNode.parentNode === null) {
      return
    }
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue
      this.__pendingValue = noChange
      directive(this)
    }
    const value = this.__pendingValue
    if (value === noChange) {
      return
    }
    if (isPrimitive(value)) {
      if (value !== this.value) {
        this.__commitText(value)
      }
    } else if (value instanceof TemplateResult) {
      this.__commitTemplateResult(value)
    } else if (value instanceof Node) {
      this.__commitNode(value)
    } else if (isIterable(value)) {
      this.__commitIterable(value)
    } else if (value === nothing) {
      this.value = nothing
      this.clear()
    } else {
      // Fallback, will render the string representation
      this.__commitText(value)
    }
  }
  __insert(node) {
    this.endNode.parentNode.insertBefore(node, this.endNode)
  }
  __commitNode(value) {
    if (this.value === value) {
      return
    }
    this.clear()
    this.__insert(value)
    this.value = value
  }
  __commitText(value) {
    const node = this.startNode.nextSibling
    value = value == null ? '' : value
    // If `value` isn't already a string, we explicitly convert it here in case
    // it can't be implicitly converted - i.e. it's a symbol.
    const valueAsString = typeof value === 'string' ? value : String(value)
    if (
      node === this.endNode.previousSibling &&
      node.nodeType === 3 /* Node.TEXT_NODE */
    ) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      // TODO(justinfagnani): Can we just check if this.value is primitive?
      node.data = valueAsString
    } else {
      this.__commitNode(document.createTextNode(valueAsString))
    }
    this.value = value
  }
  __commitTemplateResult(value) {
    const template = this.options.templateFactory(value)
    if (
      this.value instanceof TemplateInstance &&
      this.value.template === template
    ) {
      this.value.update(value.values)
    } else {
      // Make sure we propagate the template processor from the TemplateResult
      // so that we use its syntax extension, etc. The template factory comes
      // from the render function options so that it can control template
      // caching and preprocessing.
      const instance = new TemplateInstance(
        template,
        value.processor,
        this.options
      )
      const fragment = instance._clone()
      instance.update(value.values)
      this.__commitNode(fragment)
      this.value = instance
    }
  }
  __commitIterable(value) {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
    // If _value is an array, then the previous render was of an
    // iterable and _value will contain the NodeParts from the previous
    // render. If _value is not an array, clear this part and make a new
    // array for NodeParts.
    if (!Array.isArray(this.value)) {
      this.value = []
      this.clear()
    }
    // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render
    const itemParts = this.value
    let partIndex = 0
    let itemPart
    for (const item of value) {
      // Try to reuse an existing part
      itemPart = itemParts[partIndex]
      // If no existing part, create a new one
      if (itemPart === undefined) {
        itemPart = new NodePart(this.options)
        itemParts.push(itemPart)
        if (partIndex === 0) {
          itemPart.appendIntoPart(this)
        } else {
          itemPart.insertAfterPart(itemParts[partIndex - 1])
        }
      }
      itemPart.setValue(item)
      itemPart.commit()
      partIndex++
    }
    if (partIndex < itemParts.length) {
      // Truncate the parts array so _value reflects the current state
      itemParts.length = partIndex
      this.clear(itemPart && itemPart.endNode)
    }
  }
  clear(startNode = this.startNode) {
    removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode)
  }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
  constructor(element, name, strings) {
    this.value = undefined
    this.__pendingValue = undefined
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error('Boolean attributes can only contain a single expression')
    }
    this.element = element
    this.name = name
    this.strings = strings
  }
  setValue(value) {
    this.__pendingValue = value
  }
  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue
      this.__pendingValue = noChange
      directive(this)
    }
    if (this.__pendingValue === noChange) {
      return
    }
    const value = !!this.__pendingValue
    if (this.value !== value) {
      if (value) {
        this.element.setAttribute(this.name, '')
      } else {
        this.element.removeAttribute(this.name)
      }
      this.value = value
    }
    this.__pendingValue = noChange
  }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
  constructor(element, name, strings) {
    super(element, name, strings)
    this.single = strings.length === 2 && strings[0] === '' && strings[1] === ''
  }
  _createPart() {
    return new PropertyPart(this)
  }
  _getValue() {
    if (this.single) {
      return this.parts[0].value
    }
    return super._getValue()
  }
  commit() {
    if (this.dirty) {
      this.dirty = false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.element[this.name] = this._getValue()
    }
  }
}
class PropertyPart extends AttributePart {}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the third
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false
// Wrap into an IIFE because MS Edge <= v41 does not support having try/catch
// blocks right into the body of a module
;(() => {
  try {
    const options = {
      get capture() {
        eventOptionsSupported = true
        return false
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener('test', options, options)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.removeEventListener('test', options, options)
  } catch (_e) {
    // event options not supported
  }
})()
class EventPart {
  constructor(element, eventName, eventContext) {
    this.value = undefined
    this.__pendingValue = undefined
    this.element = element
    this.eventName = eventName
    this.eventContext = eventContext
    this.__boundHandleEvent = (e) => this.handleEvent(e)
  }
  setValue(value) {
    this.__pendingValue = value
  }
  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue
      this.__pendingValue = noChange
      directive(this)
    }
    if (this.__pendingValue === noChange) {
      return
    }
    const newListener = this.__pendingValue
    const oldListener = this.value
    const shouldRemoveListener =
      newListener == null ||
      (oldListener != null &&
        (newListener.capture !== oldListener.capture ||
          newListener.once !== oldListener.once ||
          newListener.passive !== oldListener.passive))
    const shouldAddListener =
      newListener != null && (oldListener == null || shouldRemoveListener)
    if (shouldRemoveListener) {
      this.element.removeEventListener(
        this.eventName,
        this.__boundHandleEvent,
        this.__options
      )
    }
    if (shouldAddListener) {
      this.__options = getOptions(newListener)
      this.element.addEventListener(
        this.eventName,
        this.__boundHandleEvent,
        this.__options
      )
    }
    this.value = newListener
    this.__pendingValue = noChange
  }
  handleEvent(event) {
    if (typeof this.value === 'function') {
      this.value.call(this.eventContext || this.element, event)
    } else {
      this.value.handleEvent(event)
    }
  }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) =>
  o &&
  (eventOptionsSupported
    ? { capture: o.capture, passive: o.passive, once: o.once }
    : o.capture)

/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
  let templateCache = templateCaches.get(result.type)
  if (templateCache === undefined) {
    templateCache = {
      stringsArray: new WeakMap(),
      keyString: new Map(),
    }
    templateCaches.set(result.type, templateCache)
  }
  let template = templateCache.stringsArray.get(result.strings)
  if (template !== undefined) {
    return template
  }
  // If the TemplateStringsArray is new, generate a key from the strings
  // This key is shared between all templates with identical content
  const key = result.strings.join(marker)
  // Check if we already have a Template for this key
  template = templateCache.keyString.get(key)
  if (template === undefined) {
    // If we have not seen this key before, create a new Template
    template = new Template(result, result.getTemplateElement())
    // Cache the Template for this key
    templateCache.keyString.set(key, template)
  }
  // Cache all future queries for this TemplateStringsArray
  templateCache.stringsArray.set(result.strings, template)
  return template
}
const templateCaches = new Map()

const parts = new WeakMap()
/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render = (result, container, options) => {
  let part = parts.get(container)
  if (part === undefined) {
    removeNodes(container, container.firstChild)
    parts.set(
      container,
      (part = new NodePart(Object.assign({ templateFactory }, options)))
    )
    part.appendInto(container)
  }
  part.setValue(result)
  part.commit()
}

/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
  /**
   * Create parts for an attribute-position binding, given the event, attribute
   * name, and string literals.
   *
   * @param element The element containing the binding
   * @param name  The attribute name
   * @param strings The string literals. There are always at least two strings,
   *   event for fully-controlled bindings with a single expression.
   */
  handleAttributeExpressions(element, name, strings, options) {
    const prefix = name[0]
    if (prefix === '.') {
      const committer = new PropertyCommitter(element, name.slice(1), strings)
      return committer.parts
    }
    if (prefix === '@') {
      return [new EventPart(element, name.slice(1), options.eventContext)]
    }
    if (prefix === '?') {
      return [new BooleanAttributePart(element, name.slice(1), strings)]
    }
    const committer = new AttributeCommitter(element, name, strings)
    return committer.parts
  }
  /**
   * Create parts for a text-position binding.
   * @param templateFactory
   */
  handleTextExpression(options) {
    return new NodePart(options)
  }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor()

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
if (typeof window !== 'undefined') {
  ;(window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.3.0')
}
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) =>
  new TemplateResult(strings, values, 'html', defaultTemplateProcessor)

// Get a key to lookup in `templateCaches`.
const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`
let compatibleShadyCSSVersion = true
if (typeof window.ShadyCSS === 'undefined') {
  compatibleShadyCSSVersion = false
} else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
  console.warn(
    `Incompatible ShadyCSS version detected. ` +
      `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and ` +
      `@webcomponents/shadycss@1.3.1.`
  )
  compatibleShadyCSSVersion = false
}
/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */
const shadyTemplateFactory = (scopeName) => (result) => {
  const cacheKey = getTemplateCacheKey(result.type, scopeName)
  let templateCache = templateCaches.get(cacheKey)
  if (templateCache === undefined) {
    templateCache = {
      stringsArray: new WeakMap(),
      keyString: new Map(),
    }
    templateCaches.set(cacheKey, templateCache)
  }
  let template = templateCache.stringsArray.get(result.strings)
  if (template !== undefined) {
    return template
  }
  const key = result.strings.join(marker)
  template = templateCache.keyString.get(key)
  if (template === undefined) {
    const element = result.getTemplateElement()
    if (compatibleShadyCSSVersion) {
      window.ShadyCSS.prepareTemplateDom(element, scopeName)
    }
    template = new Template(result, element)
    templateCache.keyString.set(key, template)
  }
  templateCache.stringsArray.set(result.strings, template)
  return template
}
const TEMPLATE_TYPES = ['html', 'svg']
/**
 * Removes all style elements from Templates for the given scopeName.
 */
const removeStylesFromLitTemplates = (scopeName) => {
  TEMPLATE_TYPES.forEach((type) => {
    const templates = templateCaches.get(getTemplateCacheKey(type, scopeName))
    if (templates !== undefined) {
      templates.keyString.forEach((template) => {
        const {
          element: { content },
        } = template
        // IE 11 doesn't support the iterable param Set constructor
        const styles = new Set()
        Array.from(content.querySelectorAll('style')).forEach((s) => {
          styles.add(s)
        })
        removeNodesFromTemplate(template, styles)
      })
    }
  })
}
const shadyRenderSet = new Set()
/**
 * For the given scope name, ensures that ShadyCSS style scoping is performed.
 * This is done just once per scope name so the fragment and template cannot
 * be modified.
 * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
 * to be scoped and appended to the document
 * (2) removes style elements from all lit-html Templates for this scope name.
 *
 * Note, <style> elements can only be placed into templates for the
 * initial rendering of the scope. If <style> elements are included in templates
 * dynamically rendered to the scope (after the first scope render), they will
 * not be scoped and the <style> will be left in the template and rendered
 * output.
 */
const prepareTemplateStyles = (scopeName, renderedDOM, template) => {
  shadyRenderSet.add(scopeName)
  // If `renderedDOM` is stamped from a Template, then we need to edit that
  // Template's underlying template element. Otherwise, we create one here
  // to give to ShadyCSS, which still requires one while scoping.
  const templateElement = !!template
    ? template.element
    : document.createElement('template')
  // Move styles out of rendered DOM and store.
  const styles = renderedDOM.querySelectorAll('style')
  const { length } = styles
  // If there are no styles, skip unnecessary work
  if (length === 0) {
    // Ensure prepareTemplateStyles is called to support adding
    // styles via `prepareAdoptedCssText` since that requires that
    // `prepareTemplateStyles` is called.
    //
    // ShadyCSS will only update styles containing @apply in the template
    // given to `prepareTemplateStyles`. If no lit Template was given,
    // ShadyCSS will not be able to update uses of @apply in any relevant
    // template. However, this is not a problem because we only create the
    // template for the purpose of supporting `prepareAdoptedCssText`,
    // which doesn't support @apply at all.
    window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName)
    return
  }
  const condensedStyle = document.createElement('style')
  // Collect styles into a single style. This helps us make sure ShadyCSS
  // manipulations will not prevent us from being able to fix up template
  // part indices.
  // NOTE: collecting styles is inefficient for browsers but ShadyCSS
  // currently does this anyway. When it does not, this should be changed.
  for (let i = 0; i < length; i++) {
    const style = styles[i]
    style.parentNode.removeChild(style)
    condensedStyle.textContent += style.textContent
  }
  // Remove styles from nested templates in this scope.
  removeStylesFromLitTemplates(scopeName)
  // And then put the condensed style into the "root" template passed in as
  // `template`.
  const content = templateElement.content
  if (!!template) {
    insertNodeIntoTemplate(template, condensedStyle, content.firstChild)
  } else {
    content.insertBefore(condensedStyle, content.firstChild)
  }
  // Note, it's important that ShadyCSS gets the template that `lit-html`
  // will actually render so that it can update the style inside when
  // needed (e.g. @apply native Shadow DOM case).
  window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName)
  const style = content.querySelector('style')
  if (window.ShadyCSS.nativeShadow && style !== null) {
    // When in native Shadow DOM, ensure the style created by ShadyCSS is
    // included in initially rendered output (`renderedDOM`).
    renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild)
  } else if (!!template) {
    // When no style is left in the template, parts will be broken as a
    // result. To fix this, we put back the style node ShadyCSS removed
    // and then tell lit to remove that node from the template.
    // There can be no style in the template in 2 cases (1) when Shady DOM
    // is in use, ShadyCSS removes all styles, (2) when native Shadow DOM
    // is in use ShadyCSS removes the style if it contains no content.
    // NOTE, ShadyCSS creates its own style so we can safely add/remove
    // `condensedStyle` here.
    content.insertBefore(condensedStyle, content.firstChild)
    const removes = new Set()
    removes.add(condensedStyle)
    removeNodesFromTemplate(template, removes)
  }
}
/**
 * Extension to the standard `render` method which supports rendering
 * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
 * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
 * or when the webcomponentsjs
 * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
 *
 * Adds a `scopeName` option which is used to scope element DOM and stylesheets
 * when native ShadowDOM is unavailable. The `scopeName` will be added to
 * the class attribute of all rendered DOM. In addition, any style elements will
 * be automatically re-written with this `scopeName` selector and moved out
 * of the rendered DOM and into the document `<head>`.
 *
 * It is common to use this render method in conjunction with a custom element
 * which renders a shadowRoot. When this is done, typically the element's
 * `localName` should be used as the `scopeName`.
 *
 * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
 * custom properties (needed only on older browsers like IE11) and a shim for
 * a deprecated feature called `@apply` that supports applying a set of css
 * custom properties to a given location.
 *
 * Usage considerations:
 *
 * * Part values in `<style>` elements are only applied the first time a given
 * `scopeName` renders. Subsequent changes to parts in style elements will have
 * no effect. Because of this, parts in style elements should only be used for
 * values that will never change, for example parts that set scope-wide theme
 * values or parts which render shared style elements.
 *
 * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
 * custom element's `constructor` is not supported. Instead rendering should
 * either done asynchronously, for example at microtask timing (for example
 * `Promise.resolve()`), or be deferred until the first time the element's
 * `connectedCallback` runs.
 *
 * Usage considerations when using shimmed custom properties or `@apply`:
 *
 * * Whenever any dynamic changes are made which affect
 * css custom properties, `ShadyCSS.styleElement(element)` must be called
 * to update the element. There are two cases when this is needed:
 * (1) the element is connected to a new parent, (2) a class is added to the
 * element that causes it to match different custom properties.
 * To address the first case when rendering a custom element, `styleElement`
 * should be called in the element's `connectedCallback`.
 *
 * * Shimmed custom properties may only be defined either for an entire
 * shadowRoot (for example, in a `:host` rule) or via a rule that directly
 * matches an element with a shadowRoot. In other words, instead of flowing from
 * parent to child as do native css custom properties, shimmed custom properties
 * flow only from shadowRoots to nested shadowRoots.
 *
 * * When using `@apply` mixing css shorthand property names with
 * non-shorthand names (for example `border` and `border-width`) is not
 * supported.
 */
const render$1 = (result, container, options) => {
  if (!options || typeof options !== 'object' || !options.scopeName) {
    throw new Error('The `scopeName` option is required.')
  }
  const scopeName = options.scopeName
  const hasRendered = parts.has(container)
  const needsScoping =
    compatibleShadyCSSVersion &&
    container.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */ &&
    !!container.host
  // Handle first render to a scope specially...
  const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName)
  // On first scope render, render into a fragment; this cannot be a single
  // fragment that is reused since nested renders can occur synchronously.
  const renderContainer = firstScopeRender
    ? document.createDocumentFragment()
    : container
  render(
    result,
    renderContainer,
    Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options)
  )
  // When performing first scope render,
  // (1) We've rendered into a fragment so that there's a chance to
  // `prepareTemplateStyles` before sub-elements hit the DOM
  // (which might cause them to render based on a common pattern of
  // rendering in a custom element's `connectedCallback`);
  // (2) Scope the template with ShadyCSS one time only for this scope.
  // (3) Render the fragment into the container and make sure the
  // container knows its `part` is the one we just rendered. This ensures
  // DOM will be re-used on subsequent renders.
  if (firstScopeRender) {
    const part = parts.get(renderContainer)
    parts.delete(renderContainer)
    // ShadyCSS might have style sheets (e.g. from `prepareAdoptedCssText`)
    // that should apply to `renderContainer` even if the rendered value is
    // not a TemplateInstance. However, it will only insert scoped styles
    // into the document if `prepareTemplateStyles` has already been called
    // for the given scope name.
    const template =
      part.value instanceof TemplateInstance ? part.value.template : undefined
    prepareTemplateStyles(scopeName, renderContainer, template)
    removeNodes(container, container.firstChild)
    container.appendChild(renderContainer)
    parts.set(container, part)
  }
  // After elements have hit the DOM, update styling if this is the
  // initial render to this container.
  // This is needed whenever dynamic changes are made so it would be
  // safest to do every render; however, this would regress performance
  // so we leave it up to the user to call `ShadyCSS.styleElement`
  // for dynamic changes.
  if (!hasRendered && needsScoping) {
    window.ShadyCSS.styleElement(container.host)
  }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
var _a
/**
 * Use this module if you want to create your own base class extending
 * [[UpdatingElement]].
 * @packageDocumentation
 */
/*
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */
window.JSCompiler_renameProperty = (prop, _obj) => prop
const defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value ? '' : null
      case Object:
      case Array:
        // if the value is `null` or `undefined` pass this through
        // to allow removing/no change behavior.
        return value == null ? value : JSON.stringify(value)
    }
    return value
  },
  fromAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value !== null
      case Number:
        return value === null ? null : Number(value)
      case Object:
      case Array:
        return JSON.parse(value)
    }
    return value
  },
}
/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
const notEqual = (value, old) => {
  // This ensures (old==NaN, value==NaN) always returns false
  return old !== value && (old === old || value === value)
}
const defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual,
}
const STATE_HAS_UPDATED = 1
const STATE_UPDATE_REQUESTED = 1 << 2
const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3
const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4
/**
 * The Closure JS Compiler doesn't currently have good support for static
 * property semantics where "this" is dynamic (e.g.
 * https://github.com/google/closure-compiler/issues/3177 and others) so we use
 * this hack to bypass any rewriting by the compiler.
 */
const finalized = 'finalized'
/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclassers to render updates as desired.
 * @noInheritDoc
 */
class UpdatingElement extends HTMLElement {
  constructor() {
    super()
    this.initialize()
  }
  /**
   * Returns a list of attributes corresponding to the registered properties.
   * @nocollapse
   */
  static get observedAttributes() {
    // note: piggy backing on this to ensure we're finalized.
    this.finalize()
    const attributes = []
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    this._classProperties.forEach((v, p) => {
      const attr = this._attributeNameForProperty(p, v)
      if (attr !== undefined) {
        this._attributeToPropertyMap.set(attr, p)
        attributes.push(attr)
      }
    })
    return attributes
  }
  /**
   * Ensures the private `_classProperties` property metadata is created.
   * In addition to `finalize` this is also called in `createProperty` to
   * ensure the `@property` decorator can add property metadata.
   */
  /** @nocollapse */
  static _ensureClassProperties() {
    // ensure private storage for property declarations.
    if (
      !this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))
    ) {
      this._classProperties = new Map()
      // NOTE: Workaround IE11 not supporting Map constructor argument.
      const superProperties = Object.getPrototypeOf(this)._classProperties
      if (superProperties !== undefined) {
        superProperties.forEach((v, k) => this._classProperties.set(k, v))
      }
    }
  }
  /**
   * Creates a property accessor on the element prototype if one does not exist
   * and stores a PropertyDeclaration for the property with the given options.
   * The property setter calls the property's `hasChanged` property option
   * or uses a strict identity check to determine whether or not to request
   * an update.
   *
   * This method may be overridden to customize properties; however,
   * when doing so, it's important to call `super.createProperty` to ensure
   * the property is setup correctly. This method calls
   * `getPropertyDescriptor` internally to get a descriptor to install.
   * To customize what properties do when they are get or set, override
   * `getPropertyDescriptor`. To customize the options for a property,
   * implement `createProperty` like this:
   *
   * static createProperty(name, options) {
   *   options = Object.assign(options, {myOption: true});
   *   super.createProperty(name, options);
   * }
   *
   * @nocollapse
   */
  static createProperty(name, options = defaultPropertyDeclaration) {
    // Note, since this can be called by the `@property` decorator which
    // is called before `finalize`, we ensure storage exists for property
    // metadata.
    this._ensureClassProperties()
    this._classProperties.set(name, options)
    // Do not generate an accessor if the prototype already has one, since
    // it would be lost otherwise and that would never be the user's intention;
    // Instead, we expect users to call `requestUpdate` themselves from
    // user-defined accessors. Note that if the super has an accessor we will
    // still overwrite it
    if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
      return
    }
    const key = typeof name === 'symbol' ? Symbol() : `__${name}`
    const descriptor = this.getPropertyDescriptor(name, key, options)
    if (descriptor !== undefined) {
      Object.defineProperty(this.prototype, name, descriptor)
    }
  }
  /**
   * Returns a property descriptor to be defined on the given named property.
   * If no descriptor is returned, the property will not become an accessor.
   * For example,
   *
   *   class MyElement extends LitElement {
   *     static getPropertyDescriptor(name, key, options) {
   *       const defaultDescriptor =
   *           super.getPropertyDescriptor(name, key, options);
   *       const setter = defaultDescriptor.set;
   *       return {
   *         get: defaultDescriptor.get,
   *         set(value) {
   *           setter.call(this, value);
   *           // custom action.
   *         },
   *         configurable: true,
   *         enumerable: true
   *       }
   *     }
   *   }
   *
   * @nocollapse
   */
  static getPropertyDescriptor(name, key, options) {
    return {
      // tslint:disable-next-line:no-any no symbol in index
      get() {
        return this[key]
      },
      set(value) {
        const oldValue = this[name]
        this[key] = value
        this.requestUpdateInternal(name, oldValue, options)
      },
      configurable: true,
      enumerable: true,
    }
  }
  /**
   * Returns the property options associated with the given property.
   * These options are defined with a PropertyDeclaration via the `properties`
   * object or the `@property` decorator and are registered in
   * `createProperty(...)`.
   *
   * Note, this method should be considered "final" and not overridden. To
   * customize the options for a given property, override `createProperty`.
   *
   * @nocollapse
   * @final
   */
  static getPropertyOptions(name) {
    return (
      (this._classProperties && this._classProperties.get(name)) ||
      defaultPropertyDeclaration
    )
  }
  /**
   * Creates property accessors for registered properties and ensures
   * any superclasses are also finalized.
   * @nocollapse
   */
  static finalize() {
    // finalize any superclasses
    const superCtor = Object.getPrototypeOf(this)
    if (!superCtor.hasOwnProperty(finalized)) {
      superCtor.finalize()
    }
    this[finalized] = true
    this._ensureClassProperties()
    // initialize Map populated in observedAttributes
    this._attributeToPropertyMap = new Map()
    // make any properties
    // Note, only process "own" properties since this element will inherit
    // any properties defined on the superClass, and finalization ensures
    // the entire prototype chain is finalized.
    if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
      const props = this.properties
      // support symbols in properties (IE11 does not support this)
      const propKeys = [
        ...Object.getOwnPropertyNames(props),
        ...(typeof Object.getOwnPropertySymbols === 'function'
          ? Object.getOwnPropertySymbols(props)
          : []),
      ]
      // This for/of is ok because propKeys is an array
      for (const p of propKeys) {
        // note, use of `any` is due to TypeSript lack of support for symbol in
        // index types
        // tslint:disable-next-line:no-any no symbol in index
        this.createProperty(p, props[p])
      }
    }
  }
  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */
  static _attributeNameForProperty(name, options) {
    const attribute = options.attribute
    return attribute === false
      ? undefined
      : typeof attribute === 'string'
      ? attribute
      : typeof name === 'string'
      ? name.toLowerCase()
      : undefined
  }
  /**
   * Returns true if a property should request an update.
   * Called when a property value is set and uses the `hasChanged`
   * option for the property if present or a strict identity check.
   * @nocollapse
   */
  static _valueHasChanged(value, old, hasChanged = notEqual) {
    return hasChanged(value, old)
  }
  /**
   * Returns the property value for the given attribute value.
   * Called via the `attributeChangedCallback` and uses the property's
   * `converter` or `converter.fromAttribute` property option.
   * @nocollapse
   */
  static _propertyValueFromAttribute(value, options) {
    const type = options.type
    const converter = options.converter || defaultConverter
    const fromAttribute =
      typeof converter === 'function' ? converter : converter.fromAttribute
    return fromAttribute ? fromAttribute(value, type) : value
  }
  /**
   * Returns the attribute value for the given property value. If this
   * returns undefined, the property will *not* be reflected to an attribute.
   * If this returns null, the attribute will be removed, otherwise the
   * attribute will be set to the value.
   * This uses the property's `reflect` and `type.toAttribute` property options.
   * @nocollapse
   */
  static _propertyValueToAttribute(value, options) {
    if (options.reflect === undefined) {
      return
    }
    const type = options.type
    const converter = options.converter
    const toAttribute =
      (converter && converter.toAttribute) || defaultConverter.toAttribute
    return toAttribute(value, type)
  }
  /**
   * Performs element initialization. By default captures any pre-set values for
   * registered properties.
   */
  initialize() {
    this._updateState = 0
    this._updatePromise = new Promise(
      (res) => (this._enableUpdatingResolver = res)
    )
    this._changedProperties = new Map()
    this._saveInstanceProperties()
    // ensures first update will be caught by an early access of
    // `updateComplete`
    this.requestUpdateInternal()
  }
  /**
   * Fixes any properties set on the instance before upgrade time.
   * Otherwise these would shadow the accessor and break these properties.
   * The properties are stored in a Map which is played back after the
   * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
   * (<=41), properties created for native platform properties like (`id` or
   * `name`) may not have default values set in the element constructor. On
   * these browsers native properties appear on instances and therefore their
   * default value will overwrite any element default (e.g. if the element sets
   * this.id = 'id' in the constructor, the 'id' will become '' since this is
   * the native platform default).
   */
  _saveInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    this.constructor._classProperties.forEach((_v, p) => {
      if (this.hasOwnProperty(p)) {
        const value = this[p]
        delete this[p]
        if (!this._instanceProperties) {
          this._instanceProperties = new Map()
        }
        this._instanceProperties.set(p, value)
      }
    })
  }
  /**
   * Applies previously saved instance properties.
   */
  _applyInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    // tslint:disable-next-line:no-any
    this._instanceProperties.forEach((v, p) => (this[p] = v))
    this._instanceProperties = undefined
  }
  connectedCallback() {
    // Ensure first connection completes an update. Updates cannot complete
    // before connection.
    this.enableUpdating()
  }
  enableUpdating() {
    if (this._enableUpdatingResolver !== undefined) {
      this._enableUpdatingResolver()
      this._enableUpdatingResolver = undefined
    }
  }
  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   */
  disconnectedCallback() {}
  /**
   * Synchronizes property values when attributes change.
   */
  attributeChangedCallback(name, old, value) {
    if (old !== value) {
      this._attributeToProperty(name, value)
    }
  }
  _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
    const ctor = this.constructor
    const attr = ctor._attributeNameForProperty(name, options)
    if (attr !== undefined) {
      const attrValue = ctor._propertyValueToAttribute(value, options)
      // an undefined value does not change the attribute.
      if (attrValue === undefined) {
        return
      }
      // Track if the property is being reflected to avoid
      // setting the property again via `attributeChangedCallback`. Note:
      // 1. this takes advantage of the fact that the callback is synchronous.
      // 2. will behave incorrectly if multiple attributes are in the reaction
      // stack at time of calling. However, since we process attributes
      // in `update` this should not be possible (or an extreme corner case
      // that we'd like to discover).
      // mark state reflecting
      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE
      if (attrValue == null) {
        this.removeAttribute(attr)
      } else {
        this.setAttribute(attr, attrValue)
      }
      // mark state not reflecting
      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE
    }
  }
  _attributeToProperty(name, value) {
    // Use tracking info to avoid deserializing attribute value if it was
    // just set from a property setter.
    if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
      return
    }
    const ctor = this.constructor
    // Note, hint this as an `AttributeMap` so closure clearly understands
    // the type; it has issues with tracking types through statics
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const propName = ctor._attributeToPropertyMap.get(name)
    if (propName !== undefined) {
      const options = ctor.getPropertyOptions(propName)
      // mark state reflecting
      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY
      this[propName] =
        // tslint:disable-next-line:no-any
        ctor._propertyValueFromAttribute(value, options)
      // mark state not reflecting
      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY
    }
  }
  /**
   * This protected version of `requestUpdate` does not access or return the
   * `updateComplete` promise. This promise can be overridden and is therefore
   * not free to access.
   */
  requestUpdateInternal(name, oldValue, options) {
    let shouldRequestUpdate = true
    // If we have a property key, perform property update steps.
    if (name !== undefined) {
      const ctor = this.constructor
      options = options || ctor.getPropertyOptions(name)
      if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
        if (!this._changedProperties.has(name)) {
          this._changedProperties.set(name, oldValue)
        }
        // Add to reflecting properties set.
        // Note, it's important that every change has a chance to add the
        // property to `_reflectingProperties`. This ensures setting
        // attribute + property reflects correctly.
        if (
          options.reflect === true &&
          !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)
        ) {
          if (this._reflectingProperties === undefined) {
            this._reflectingProperties = new Map()
          }
          this._reflectingProperties.set(name, options)
        }
      } else {
        // Abort the request if the property should not be considered changed.
        shouldRequestUpdate = false
      }
    }
    if (!this._hasRequestedUpdate && shouldRequestUpdate) {
      this._updatePromise = this._enqueueUpdate()
    }
  }
  /**
   * Requests an update which is processed asynchronously. This should
   * be called when an element should update based on some state not triggered
   * by setting a property. In this case, pass no arguments. It should also be
   * called when manually implementing a property setter. In this case, pass the
   * property `name` and `oldValue` to ensure that any configured property
   * options are honored. Returns the `updateComplete` Promise which is resolved
   * when the update completes.
   *
   * @param name {PropertyKey} (optional) name of requesting property
   * @param oldValue {any} (optional) old value of requesting property
   * @returns {Promise} A Promise that is resolved when the update completes.
   */
  requestUpdate(name, oldValue) {
    this.requestUpdateInternal(name, oldValue)
    return this.updateComplete
  }
  /**
   * Sets up the element to asynchronously update.
   */
  async _enqueueUpdate() {
    this._updateState = this._updateState | STATE_UPDATE_REQUESTED
    try {
      // Ensure any previous update has resolved before updating.
      // This `await` also ensures that property changes are batched.
      await this._updatePromise
    } catch (e) {
      // Ignore any previous errors. We only care that the previous cycle is
      // done. Any error should have been handled in the previous update.
    }
    const result = this.performUpdate()
    // If `performUpdate` returns a Promise, we await it. This is done to
    // enable coordinating updates with a scheduler. Note, the result is
    // checked to avoid delaying an additional microtask unless we need to.
    if (result != null) {
      await result
    }
    return !this._hasRequestedUpdate
  }
  get _hasRequestedUpdate() {
    return this._updateState & STATE_UPDATE_REQUESTED
  }
  get hasUpdated() {
    return this._updateState & STATE_HAS_UPDATED
  }
  /**
   * Performs an element update. Note, if an exception is thrown during the
   * update, `firstUpdated` and `updated` will not be called.
   *
   * You can override this method to change the timing of updates. If this
   * method is overridden, `super.performUpdate()` must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```
   * protected async performUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.performUpdate();
   * }
   * ```
   */
  performUpdate() {
    // Abort any update if one is not pending when this is called.
    // This can happen if `performUpdate` is called early to "flush"
    // the update.
    if (!this._hasRequestedUpdate) {
      return
    }
    // Mixin instance properties once, if they exist.
    if (this._instanceProperties) {
      this._applyInstanceProperties()
    }
    let shouldUpdate = false
    const changedProperties = this._changedProperties
    try {
      shouldUpdate = this.shouldUpdate(changedProperties)
      if (shouldUpdate) {
        this.update(changedProperties)
      } else {
        this._markUpdated()
      }
    } catch (e) {
      // Prevent `firstUpdated` and `updated` from running when there's an
      // update exception.
      shouldUpdate = false
      // Ensure element can accept additional updates after an exception.
      this._markUpdated()
      throw e
    }
    if (shouldUpdate) {
      if (!(this._updateState & STATE_HAS_UPDATED)) {
        this._updateState = this._updateState | STATE_HAS_UPDATED
        this.firstUpdated(changedProperties)
      }
      this.updated(changedProperties)
    }
  }
  _markUpdated() {
    this._changedProperties = new Map()
    this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED
  }
  /**
   * Returns a Promise that resolves when the element has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update.
   *
   * To await additional asynchronous work, override the `_getUpdateComplete`
   * method. For example, it is sometimes useful to await a rendered element
   * before fulfilling this Promise. To do this, first await
   * `super._getUpdateComplete()`, then any subsequent state.
   *
   * @returns {Promise} The Promise returns a boolean that indicates if the
   * update resolved without triggering another update.
   */
  get updateComplete() {
    return this._getUpdateComplete()
  }
  /**
   * Override point for the `updateComplete` promise.
   *
   * It is not safe to override the `updateComplete` getter directly due to a
   * limitation in TypeScript which means it is not possible to call a
   * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
   * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
   * This method should be overridden instead. For example:
   *
   *   class MyElement extends LitElement {
   *     async _getUpdateComplete() {
   *       await super._getUpdateComplete();
   *       await this._myChild.updateComplete;
   *     }
   *   }
   */
  _getUpdateComplete() {
    return this._updatePromise
  }
  /**
   * Controls whether or not `update` should be called when the element requests
   * an update. By default, this method always returns `true`, but this can be
   * customized to control when to update.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  shouldUpdate(_changedProperties) {
    return true
  }
  /**
   * Updates the element. This method reflects property values to attributes.
   * It can be overridden to render and keep updated element DOM.
   * Setting properties inside this method will *not* trigger
   * another update.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  update(_changedProperties) {
    if (
      this._reflectingProperties !== undefined &&
      this._reflectingProperties.size > 0
    ) {
      // Use forEach so this works even if for/of loops are compiled to for
      // loops expecting arrays
      this._reflectingProperties.forEach((v, k) =>
        this._propertyToAttribute(k, this[k], v)
      )
      this._reflectingProperties = undefined
    }
    this._markUpdated()
  }
  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  updated(_changedProperties) {}
  /**
   * Invoked when the element is first updated. Implement to perform one time
   * work on the element after update.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  firstUpdated(_changedProperties) {}
}
_a = finalized
/**
 * Marks class as having finished creating properties.
 */
UpdatingElement[_a] = true

const standardProperty = (options, element) => {
  // When decorating an accessor, pass it through and add property metadata.
  // Note, the `hasOwnProperty` check in `createProperty` ensures we don't
  // stomp over the user's accessor.
  if (
    element.kind === 'method' &&
    element.descriptor &&
    !('value' in element.descriptor)
  ) {
    return Object.assign(Object.assign({}, element), {
      finisher(clazz) {
        clazz.createProperty(element.key, options)
      },
    })
  } else {
    // createProperty() takes care of defining the property, but we still
    // must return some kind of descriptor, so return a descriptor for an
    // unused prototype field. The finisher calls createProperty().
    return {
      kind: 'field',
      key: Symbol(),
      placement: 'own',
      descriptor: {},
      // When @babel/plugin-proposal-decorators implements initializers,
      // do this instead of the initializer below. See:
      // https://github.com/babel/babel/issues/9260 extras: [
      //   {
      //     kind: 'initializer',
      //     placement: 'own',
      //     initializer: descriptor.initializer,
      //   }
      // ],
      initializer() {
        if (typeof element.initializer === 'function') {
          this[element.key] = element.initializer.call(this)
        }
      },
      finisher(clazz) {
        clazz.createProperty(element.key, options)
      },
    }
  }
}
const legacyProperty = (options, proto, name) => {
  proto.constructor.createProperty(name, options)
}
/**
 * A property decorator which creates a LitElement property which reflects a
 * corresponding attribute value. A [[`PropertyDeclaration`]] may optionally be
 * supplied to configure property features.
 *
 * This decorator should only be used for public fields. Private or protected
 * fields should use the [[`internalProperty`]] decorator.
 *
 * @example
 * ```ts
 * class MyElement {
 *   @property({ type: Boolean })
 *   clicked = false;
 * }
 * ```
 * @category Decorator
 * @ExportDecoratedItems
 */
function property(options) {
  // tslint:disable-next-line:no-any decorator
  return (protoOrDescriptor, name) =>
    name !== undefined
      ? legacyProperty(options, protoOrDescriptor, name)
      : standardProperty(options, protoOrDescriptor)
}

/**
@license
Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
/**
 * Whether the current browser supports `adoptedStyleSheets`.
 */
const supportsAdoptingStyleSheets =
  window.ShadowRoot &&
  (window.ShadyCSS === undefined || window.ShadyCSS.nativeShadow) &&
  'adoptedStyleSheets' in Document.prototype &&
  'replace' in CSSStyleSheet.prototype
const constructionToken = Symbol()
class CSSResult {
  constructor(cssText, safeToken) {
    if (safeToken !== constructionToken) {
      throw new Error(
        'CSSResult is not constructable. Use `unsafeCSS` or `css` instead.'
      )
    }
    this.cssText = cssText
  }
  // Note, this is a getter so that it's lazy. In practice, this means
  // stylesheets are not created until the first element instance is made.
  get styleSheet() {
    if (this._styleSheet === undefined) {
      // Note, if `supportsAdoptingStyleSheets` is true then we assume
      // CSSStyleSheet is constructable.
      if (supportsAdoptingStyleSheets) {
        this._styleSheet = new CSSStyleSheet()
        this._styleSheet.replaceSync(this.cssText)
      } else {
        this._styleSheet = null
      }
    }
    return this._styleSheet
  }
  toString() {
    return this.cssText
  }
}
/**
 * Wrap a value for interpolation in a [[`css`]] tagged template literal.
 *
 * This is unsafe because untrusted CSS text can be used to phone home
 * or exfiltrate data to an attacker controlled site. Take care to only use
 * this with trusted input.
 */
const unsafeCSS = (value) => {
  return new CSSResult(String(value), constructionToken)
}
const textFromCSSResult = (value) => {
  if (value instanceof CSSResult) {
    return value.cssText
  } else if (typeof value === 'number') {
    return value
  } else {
    throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`)
  }
}
/**
 * Template tag which which can be used with LitElement's [[LitElement.styles |
 * `styles`]] property to set element styles. For security reasons, only literal
 * string values may be used. To incorporate non-literal values [[`unsafeCSS`]]
 * may be used inside a template string part.
 */
const css = (strings, ...values) => {
  const cssText = values.reduce(
    (acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1],
    strings[0]
  )
  return new CSSResult(cssText, constructionToken)
}

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for LitElement usage.
// TODO(justinfagnani): inject version number at build time
;(window['litElementVersions'] || (window['litElementVersions'] = [])).push(
  '2.4.0'
)
/**
 * Sentinal value used to avoid calling lit-html's render function when
 * subclasses do not implement `render`
 */
const renderNotImplemented = {}
/**
 * Base element class that manages element properties and attributes, and
 * renders a lit-html template.
 *
 * To define a component, subclass `LitElement` and implement a
 * `render` method to provide the component's template. Define properties
 * using the [[`properties`]] property or the [[`property`]] decorator.
 */
class LitElement extends UpdatingElement {
  /**
   * Return the array of styles to apply to the element.
   * Override this method to integrate into a style management system.
   *
   * @nocollapse
   */
  static getStyles() {
    return this.styles
  }
  /** @nocollapse */
  static _getUniqueStyles() {
    // Only gather styles once per class
    if (this.hasOwnProperty(JSCompiler_renameProperty('_styles', this))) {
      return
    }
    // Take care not to call `this.getStyles()` multiple times since this
    // generates new CSSResults each time.
    // TODO(sorvell): Since we do not cache CSSResults by input, any
    // shared styles will generate new stylesheet objects, which is wasteful.
    // This should be addressed when a browser ships constructable
    // stylesheets.
    const userStyles = this.getStyles()
    if (Array.isArray(userStyles)) {
      // De-duplicate styles preserving the _last_ instance in the set.
      // This is a performance optimization to avoid duplicated styles that can
      // occur especially when composing via subclassing.
      // The last item is kept to try to preserve the cascade order with the
      // assumption that it's most important that last added styles override
      // previous styles.
      const addStyles = (styles, set) =>
        styles.reduceRight(
          (set, s) =>
            // Note: On IE set.add() does not return the set
            Array.isArray(s) ? addStyles(s, set) : (set.add(s), set),
          set
        )
      // Array.from does not work on Set in IE, otherwise return
      // Array.from(addStyles(userStyles, new Set<CSSResult>())).reverse()
      const set = addStyles(userStyles, new Set())
      const styles = []
      set.forEach((v) => styles.unshift(v))
      this._styles = styles
    } else {
      this._styles = userStyles === undefined ? [] : [userStyles]
    }
    // Ensure that there are no invalid CSSStyleSheet instances here. They are
    // invalid in two conditions.
    // (1) the sheet is non-constructible (`sheet` of a HTMLStyleElement), but
    //     this is impossible to check except via .replaceSync or use
    // (2) the ShadyCSS polyfill is enabled (:. supportsAdoptingStyleSheets is
    //     false)
    this._styles = this._styles.map((s) => {
      if (s instanceof CSSStyleSheet && !supportsAdoptingStyleSheets) {
        // Flatten the cssText from the passed constructible stylesheet (or
        // undetectable non-constructible stylesheet). The user might have
        // expected to update their stylesheets over time, but the alternative
        // is a crash.
        const cssText = Array.prototype.slice
          .call(s.cssRules)
          .reduce((css, rule) => css + rule.cssText, '')
        return unsafeCSS(cssText)
      }
      return s
    })
  }
  /**
   * Performs element initialization. By default this calls
   * [[`createRenderRoot`]] to create the element [[`renderRoot`]] node and
   * captures any pre-set values for registered properties.
   */
  initialize() {
    super.initialize()
    this.constructor._getUniqueStyles()
    this.renderRoot = this.createRenderRoot()
    // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
    // element's getRootNode(). While this could be done, we're choosing not to
    // support this now since it would require different logic around de-duping.
    if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
      this.adoptStyles()
    }
  }
  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   * @returns {Element|DocumentFragment} Returns a node into which to render.
   */
  createRenderRoot() {
    return this.attachShadow({ mode: 'open' })
  }
  /**
   * Applies styling to the element shadowRoot using the [[`styles`]]
   * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
   * available and will fallback otherwise. When Shadow DOM is polyfilled,
   * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
   * is available but `adoptedStyleSheets` is not, styles are appended to the
   * end of the `shadowRoot` to [mimic spec
   * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
   */
  adoptStyles() {
    const styles = this.constructor._styles
    if (styles.length === 0) {
      return
    }
    // There are three separate cases here based on Shadow DOM support.
    // (1) shadowRoot polyfilled: use ShadyCSS
    // (2) shadowRoot.adoptedStyleSheets available: use it
    // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
    // rendering
    if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
      window.ShadyCSS.ScopingShim.prepareAdoptedCssText(
        styles.map((s) => s.cssText),
        this.localName
      )
    } else if (supportsAdoptingStyleSheets) {
      this.renderRoot.adoptedStyleSheets = styles.map((s) =>
        s instanceof CSSStyleSheet ? s : s.styleSheet
      )
    } else {
      // This must be done after rendering so the actual style insertion is done
      // in `update`.
      this._needsShimAdoptedStyleSheets = true
    }
  }
  connectedCallback() {
    super.connectedCallback()
    // Note, first update/render handles styleElement so we only call this if
    // connected after first update.
    if (this.hasUpdated && window.ShadyCSS !== undefined) {
      window.ShadyCSS.styleElement(this)
    }
  }
  /**
   * Updates the element. This method reflects property values to attributes
   * and calls `render` to render DOM via lit-html. Setting properties inside
   * this method will *not* trigger another update.
   * @param _changedProperties Map of changed properties with old values
   */
  update(changedProperties) {
    // Setting properties in `render` should not trigger an update. Since
    // updates are allowed after super.update, it's important to call `render`
    // before that.
    const templateResult = this.render()
    super.update(changedProperties)
    // If render is not implemented by the component, don't call lit-html render
    if (templateResult !== renderNotImplemented) {
      this.constructor.render(templateResult, this.renderRoot, {
        scopeName: this.localName,
        eventContext: this,
      })
    }
    // When native Shadow DOM is used but adoptedStyles are not supported,
    // insert styling after rendering to ensure adoptedStyles have highest
    // priority.
    if (this._needsShimAdoptedStyleSheets) {
      this._needsShimAdoptedStyleSheets = false
      this.constructor._styles.forEach((s) => {
        const style = document.createElement('style')
        style.textContent = s.cssText
        this.renderRoot.appendChild(style)
      })
    }
  }
  /**
   * Invoked on each update to perform rendering tasks. This method may return
   * any value renderable by lit-html's `NodePart` - typically a
   * `TemplateResult`. Setting properties inside this method will *not* trigger
   * the element to update.
   */
  render() {
    return renderNotImplemented
  }
}
/**
 * Ensure this class is marked as `finalized` as an optimization ensuring
 * it will not needlessly try to `finalize`.
 *
 * Note this property name is a string to prevent breaking Closure JS Compiler
 * optimizations. See updating-element.ts for more information.
 */
LitElement['finalized'] = true
/**
 * Reference to the underlying library method used to render the element's
 * DOM. By default, points to the `render` method from lit-html's shady-render
 * module.
 *
 * **Most users will never need to touch this property.**
 *
 * This  property should not be confused with the `render` instance method,
 * which should be overridden to define a template for the element.
 *
 * Advanced users creating a new base class based on LitElement can override
 * this property to point to a custom render method with a signature that
 * matches [shady-render's `render`
 * method](https://lit-html.polymer-project.org/api/modules/shady_render.html#render).
 *
 * @nocollapse
 */
LitElement.render = render$1

function fireEvent(node, type, detail, options = {}) {
  options = options || {}
  detail = detail === null || detail === undefined ? {} : detail
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  })
  event.detail = detail
  node.dispatchEvent(event)
  return event
}

function setValue(obj, path, value) {
  const pathFragments = path.split('.')
  let o = obj
  while (pathFragments.length - 1) {
    var fragment = pathFragments.shift()
    if (!o.hasOwnProperty(fragment)) o[fragment] = {}
    o = o[fragment]
  }
  o[pathFragments[0]] = value
}
const OptionsDecimals = [0, 1]
const OptionsStepSize = [0.5, 1]
const OptionsStepLayout = ['column', 'row']
const OptionsThemes = ['standard', 'modern']
const OptionsControlStyles = ['classic', 'dial']
const includeDomains = ['climate']
const GithubReadMe =
  'https://github.com/nervetattoo/simple-thermostat/blob/master/README.md'
const stub = {
  header: {},
  control: {},
  layout: {
    mode: {},
  },
}
const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj))
class SimpleThermostatEditor extends LitElement {
  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        padding: 0;
      }
      .overall-config {
        margin-bottom: 20px;
      }
      .row {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        gap: 16px;
        margin-bottom: 16px;
      }
      .row > * {
        flex: 1;
        min-width: 0;
      }
      .toggle-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 8px;
      }
      ha-formfield {
        display: block;
        margin-bottom: 8px;
      }
      .native-select-wrapper {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }
      .native-select-wrapper label {
        font-size: 12px;
        color: var(--secondary-text-color, #999);
        margin-bottom: 4px;
        font-weight: 500;
      }
      .native-select-wrapper select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        background-color: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #fff);
        font-size: 14px;
        font-family: inherit;
        appearance: auto;
        cursor: pointer;
        outline: none;
        transition: border-color 0.2s;
      }
      .native-select-wrapper select:focus {
        border-color: var(--primary-color, #03a9f4);
      }
      .info-text {
        color: var(--secondary-text-color, #999);
        font-size: 12px;
        margin-top: 16px;
        padding: 8px 0;
        border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      }
    `
  }
  static get properties() {
    return { hass: {}, config: {} }
  }
  static getStubConfig() {
    return Object.assign({}, stub)
  }
  setConfig(config) {
    this.config = config || Object.assign({}, stub)
  }
  _openLink() {
    window.open(GithubReadMe)
  }
  render() {
    var _a,
      _b,
      _c,
      _d,
      _e,
      _f,
      _g,
      _h,
      _j,
      _k,
      _l,
      _m,
      _o,
      _p,
      _q,
      _r,
      _s,
      _t,
      _u,
      _v,
      _w,
      _x,
      _y,
      _z,
      _0
    if (!this.hass) return html``
    return html`
      <div class="card-config">
        <div class="overall-config">
          <!-- Entity Picker -->
          <div class="row">
            <ha-entity-picker
              label="Entity (required)"
              .hass=${this.hass}
              .value="${this.config.entity}"
              .configValue=${'entity'}
              .includeDomains=${includeDomains}
              @change="${this.valueChanged}"
              allow-custom-entity
            ></ha-entity-picker>
          </div>

          <!-- Toggle Switches -->
          <ha-formfield label="Show header?">
            <ha-switch
              .checked=${this.config.header !== false}
              @change=${this.toggleHeader}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show current temperature?">
            <ha-switch
              .checked=${((_b =
                (_a = this.config) === null || _a === void 0
                  ? void 0
                  : _a.hide) === null || _b === void 0
                ? void 0
                : _b.temperature) !== true}
              .configValue="${'hide.temperature'}"
              @change=${this._invertedToggleChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show state?">
            <ha-switch
              .checked=${((_d =
                (_c = this.config) === null || _c === void 0
                  ? void 0
                  : _c.hide) === null || _d === void 0
                ? void 0
                : _d.state) !== true}
              .configValue="${'hide.state'}"
              @change=${this._invertedToggleChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show mode names?">
            <ha-switch
              .checked=${((_g =
                (_f =
                  (_e = this.config) === null || _e === void 0
                    ? void 0
                    : _e.layout) === null || _f === void 0
                  ? void 0
                  : _f.mode) === null || _g === void 0
                ? void 0
                : _g.names) !== false}
              .configValue="${'layout.mode.names'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show mode icons?">
            <ha-switch
              .checked=${((_k =
                (_j =
                  (_h = this.config) === null || _h === void 0
                    ? void 0
                    : _h.layout) === null || _j === void 0
                  ? void 0
                  : _j.mode) === null || _k === void 0
                ? void 0
                : _k.icons) !== false}
              .configValue="${'layout.mode.icons'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show mode headings?">
            <ha-switch
              .checked=${((_o =
                (_m =
                  (_l = this.config) === null || _l === void 0
                    ? void 0
                    : _l.layout) === null || _m === void 0
                  ? void 0
                  : _m.mode) === null || _o === void 0
                ? void 0
                : _o.headings) !== false}
              .configValue="${'layout.mode.headings'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show HVAC modes?">
            <ha-switch
              .checked=${((_q =
                (_p = this.config) === null || _p === void 0
                  ? void 0
                  : _p.control) === null || _q === void 0
                ? void 0
                : _q.hvac) !== false}
              .configValue="${'control.hvac'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show preset modes?">
            <ha-switch
              .checked=${((_s =
                (_r = this.config) === null || _r === void 0
                  ? void 0
                  : _r.control) === null || _s === void 0
                ? void 0
                : _s.preset) !== false}
              .configValue="${'control.preset'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>

          <!-- Theme and Control Style -->
          <div class="row">
            <div class="native-select-wrapper">
              <label>Theme</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'theme')}
              >
                ${OptionsThemes.map(
                  (item) => html`
                    <option
                      value=${item}
                      ?selected=${(this.config.theme || 'standard') === item}
                    >
                      ${item}
                    </option>
                  `
                )}
              </select>
            </div>
            <div class="native-select-wrapper">
              <label>Control Style</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'control_style')}
              >
                ${OptionsControlStyles.map(
                  (item) => html`
                    <option
                      value=${item}
                      ?selected=${(this.config.control_style || 'classic') ===
                      item}
                    >
                      ${item}
                    </option>
                  `
                )}
              </select>
            </div>
          </div>

          <!-- Header fields -->
          ${this.config.header !== false
            ? html`
                <div class="row">
                  <ha-textfield
                    label="Name (optional)"
                    .value="${((_t = this.config.header) === null ||
                    _t === void 0
                      ? void 0
                      : _t.name) || ''}"
                    .configValue="${'header.name'}"
                    @input="${this.valueChanged}"
                  ></ha-textfield>

                  <ha-icon-input
                    label="Icon (optional)"
                    .value="${((_u = this.config.header) === null ||
                    _u === void 0
                      ? void 0
                      : _u.icon) || ''}"
                    .configValue=${'header.icon'}
                    @value-changed=${this.valueChanged}
                  ></ha-icon-input>
                </div>

                <div class="row">
                  <ha-entity-picker
                    label="Toggle Entity (optional)"
                    .hass=${this.hass}
                    .value="${(_x =
                      (_w =
                        (_v = this.config) === null || _v === void 0
                          ? void 0
                          : _v.header) === null || _w === void 0
                        ? void 0
                        : _w.toggle) === null || _x === void 0
                      ? void 0
                      : _x.entity}"
                    .configValue=${'header.toggle.entity'}
                    @change="${this.valueChanged}"
                    allow-custom-entity
                  ></ha-entity-picker>

                  <ha-textfield
                    label="Toggle entity label"
                    .value="${((_0 =
                      (_z =
                        (_y = this.config) === null || _y === void 0
                          ? void 0
                          : _y.header) === null || _z === void 0
                        ? void 0
                        : _z.toggle) === null || _0 === void 0
                      ? void 0
                      : _0.name) || ''}"
                    .configValue="${'header.toggle.name'}"
                    @input="${this.valueChanged}"
                  ></ha-textfield>
                </div>
              `
            : ''}

          <!-- Fallback -->
          <div class="row">
            <ha-textfield
              label="Fallback Text (optional)"
              .value="${this.config.fallback || ''}"
              .configValue="${'fallback'}"
              @input="${this.valueChanged}"
            ></ha-textfield>
          </div>

          <!-- Decimals and Unit -->
          <div class="row">
            <div class="native-select-wrapper">
              <label>Decimals</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'decimals')}
              >
                ${OptionsDecimals.map((item) => {
                  var _a
                  return html`
                    <option
                      value=${item}
                      ?selected=${Number(
                        (_a = this.config.decimals) !== null && _a !== void 0
                          ? _a
                          : 1
                      ) === item}
                    >
                      ${item}
                    </option>
                  `
                })}
              </select>
            </div>
            <ha-textfield
              label="Unit (optional)"
              .value="${this.config.unit || ''}"
              .configValue="${'unit'}"
              @input="${this.valueChanged}"
            ></ha-textfield>
          </div>

          <!-- Step Layout and Size -->
          <div class="row">
            <div class="native-select-wrapper">
              <label>Step Layout</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'layout.step')}
              >
                ${OptionsStepLayout.map((item) => {
                  var _a
                  return html`
                    <option
                      value=${item}
                      ?selected=${(((_a = this.config.layout) === null ||
                      _a === void 0
                        ? void 0
                        : _a.step) || 'column') === item}
                    >
                      ${item}
                    </option>
                  `
                })}
              </select>
            </div>
            <div class="native-select-wrapper">
              <label>Step Size</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'step_size')}
              >
                ${OptionsStepSize.map((item) => {
                  var _a
                  return html`
                    <option
                      value=${String(item)}
                      ?selected=${Number(
                        (_a = this.config.step_size) !== null && _a !== void 0
                          ? _a
                          : 0.5
                      ) === item}
                    >
                      ${item}
                    </option>
                  `
                })}
              </select>
            </div>
          </div>

          <div class="info-text">
            <mwc-button @click=${this._openLink}>
              Configuration Options
            </mwc-button>
            Advanced settings for sensors, faults, and labels can be configured
            in the code editor.
          </div>
        </div>
      </div>
    `
  }
  /**
   * Handler for native <select> dropdowns.
   */
  _nativeSelectChanged(value, configPath) {
    if (!this.config || !this.hass) return
    if (value === undefined || value === null) return
    const copy = cloneDeep(this.config)
    setValue(copy, configPath, value)
    fireEvent(this, 'config-changed', { config: copy })
  }
  valueChanged(ev) {
    if (!this.config || !this.hass) {
      return
    }
    const target = ev.currentTarget || ev.target
    const copy = cloneDeep(this.config)
    if (target.configValue) {
      if (target.value === '') {
        delete copy[target.configValue]
      } else {
        setValue(
          copy,
          target.configValue,
          target.checked !== undefined ? target.checked : target.value
        )
      }
    }
    fireEvent(this, 'config-changed', { config: copy })
  }
  toggleHeader(ev) {
    this.config.header = ev.target.checked ? {} : false
    fireEvent(this, 'config-changed', { config: this.config })
  }
  /**
   * Inverted toggle for "hide" config paths.
   * Switch ON = don't hide (remove/set false), Switch OFF = hide (set true).
   */
  _invertedToggleChanged(ev) {
    if (!this.config || !this.hass) return
    const target = ev.currentTarget || ev.target
    const copy = cloneDeep(this.config)
    if (target.configValue) {
      // Inverted: checked=true means DON'T hide, so set to false
      // checked=false means DO hide, so set to true
      setValue(copy, target.configValue, !target.checked)
    }
    fireEvent(this, 'config-changed', { config: copy })
  }
}

function __rest(s, e) {
  var t = {}
  for (var p in s)
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p]
  if (s != null && typeof Object.getOwnPropertySymbols === 'function')
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (
        e.indexOf(p[i]) < 0 &&
        Object.prototype.propertyIsEnumerable.call(s, p[i])
      )
        t[p[i]] = s[p[i]]
    }
  return t
}

function __decorate(decorators, target, key, desc) {
  var c = arguments.length,
    r =
      c < 3
        ? target
        : desc === null
        ? (desc = Object.getOwnPropertyDescriptor(target, key))
        : desc,
    d
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
    r = Reflect.decorate(decorators, target, key, desc)
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if ((d = decorators[i]))
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
  return c > 3 && r && Object.defineProperty(target, key, r), r
}

const copyProperty = (to, from, property, ignoreNonConfigurable) => {
  // `Function#length` should reflect the parameters of `to` not `from` since we keep its body.
  // `Function#prototype` is non-writable and non-configurable so can never be modified.
  if (property === 'length' || property === 'prototype') {
    return
  }

  // `Function#arguments` and `Function#caller` should not be copied. They were reported to be present in `Reflect.ownKeys` for some devices in React Native (#41), so we explicitly ignore them here.
  if (property === 'arguments' || property === 'caller') {
    return
  }

  const toDescriptor = Object.getOwnPropertyDescriptor(to, property)
  const fromDescriptor = Object.getOwnPropertyDescriptor(from, property)

  if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) {
    return
  }

  Object.defineProperty(to, property, fromDescriptor)
}

// `Object.defineProperty()` throws if the property exists, is not configurable and either:
//  - one its descriptors is changed
//  - it is non-writable and its value is changed
const canCopyProperty = function (toDescriptor, fromDescriptor) {
  return (
    toDescriptor === undefined ||
    toDescriptor.configurable ||
    (toDescriptor.writable === fromDescriptor.writable &&
      toDescriptor.enumerable === fromDescriptor.enumerable &&
      toDescriptor.configurable === fromDescriptor.configurable &&
      (toDescriptor.writable || toDescriptor.value === fromDescriptor.value))
  )
}

const changePrototype = (to, from) => {
  const fromPrototype = Object.getPrototypeOf(from)
  if (fromPrototype === Object.getPrototypeOf(to)) {
    return
  }

  Object.setPrototypeOf(to, fromPrototype)
}

const wrappedToString = (withName, fromBody) =>
  `/* Wrapped ${withName}*/\n${fromBody}`

const toStringDescriptor = Object.getOwnPropertyDescriptor(
  Function.prototype,
  'toString'
)
const toStringName = Object.getOwnPropertyDescriptor(
  Function.prototype.toString,
  'name'
)

// We call `from.toString()` early (not lazily) to ensure `from` can be garbage collected.
// We use `bind()` instead of a closure for the same reason.
// Calling `from.toString()` early also allows caching it in case `to.toString()` is called several times.
const changeToString = (to, from, name) => {
  const withName = name === '' ? '' : `with ${name.trim()}() `
  const newToString = wrappedToString.bind(null, withName, from.toString())
  // Ensure `to.toString.toString` is non-enumerable and has the same `same`
  Object.defineProperty(newToString, 'name', toStringName)
  Object.defineProperty(to, 'toString', {
    ...toStringDescriptor,
    value: newToString,
  })
}

const mimicFn = (to, from, { ignoreNonConfigurable = false } = {}) => {
  const { name } = to

  for (const property of Reflect.ownKeys(from)) {
    copyProperty(to, from, property, ignoreNonConfigurable)
  }

  changePrototype(to, from)
  changeToString(to, from, name)

  return to
}

var mimicFn_1 = mimicFn

const debounceFn = (inputFunction, options = {}) => {
  if (typeof inputFunction !== 'function') {
    throw new TypeError(
      `Expected the first argument to be a function, got \`${typeof inputFunction}\``
    )
  }

  const {
    wait = 0,
    maxWait = Number.Infinity,
    before = false,
    after = true,
  } = options

  if (!before && !after) {
    throw new Error(
      "Both `before` and `after` are false, function wouldn't be called."
    )
  }

  let timeout
  let maxTimeout
  let result

  const debouncedFunction = function (...arguments_) {
    const context = this

    const later = () => {
      timeout = undefined

      if (maxTimeout) {
        clearTimeout(maxTimeout)
        maxTimeout = undefined
      }

      if (after) {
        result = inputFunction.apply(context, arguments_)
      }
    }

    const maxLater = () => {
      maxTimeout = undefined

      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }

      if (after) {
        result = inputFunction.apply(context, arguments_)
      }
    }

    const shouldCallNow = before && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (maxWait > 0 && maxWait !== Number.Infinity && !maxTimeout) {
      maxTimeout = setTimeout(maxLater, maxWait)
    }

    if (shouldCallNow) {
      result = inputFunction.apply(context, arguments_)
    }

    return result
  }

  mimicFn_1(debouncedFunction, inputFunction)

  debouncedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }

    if (maxTimeout) {
      clearTimeout(maxTimeout)
      maxTimeout = undefined
    }
  }

  return debouncedFunction
}

function isEqual(a, b) {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) {
    return false
  }
  return !keys.some(
    (key) =>
      (a === null || a === void 0 ? void 0 : a[key]) !==
      (b === null || b === void 0 ? void 0 : b[key])
  )
}

function styleInject(css, ref) {
  if (ref === void 0) ref = {}
  var insertAt = ref.insertAt

  if (!css || typeof document === 'undefined') {
    return
  }

  var head = document.head || document.getElementsByTagName('head')[0]
  var style = document.createElement('style')
  style.type = 'text/css'

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild)
    } else {
      head.appendChild(style)
    }
  } else {
    head.appendChild(style)
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css
  } else {
    style.appendChild(document.createTextNode(css))
  }
}

var css_248z = css`
  :host {
    --st-default-spacing: 4px;
  }
  ha-card {
    -webkit-font-smoothing: var(--paper-font-body1_-_-webkit-font-smoothing);
    font-size: var(--paper-font-body1_-_font-size);
    font-weight: var(--paper-font-body1_-_font-weight);
    line-height: var(--paper-font-body1_-_line-height);

    padding-bottom: calc(var(--st-default-spacing) * 2);

    padding-bottom: calc(var(--st-spacing, var(--st-default-spacing)) * 2);

    border-radius: 16px;

    border-radius: var(--ha-card-border-radius, 16px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    box-shadow: var(--ha-card-box-shadow, 0 4px 16px rgba(0, 0, 0, 0.08));
    overflow: hidden;
    transition: all 0.3s ease-out;

    --auto-color: green;
    --heat_cool-color: springgreen;
    --cool-color: #2b9af9;
    --heat-color: #ff8100;
    --manual-color: #44739e;
    --off-color: #8a8a8a;
    --fan_only-color: #8a8a8a;
    --dry-color: #efbd07;
  }

  ha-card.no-header {
    padding: calc(var(--st-default-spacing) * 4) 0;
    padding: calc(var(--st-spacing, var(--st-default-spacing)) * 4) 0;
  }

  .body {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(-webkit-min-content, auto);
    grid-auto-columns: minmax(min-content, auto);
    align-items: center;
    justify-items: center;
    place-items: center;
    padding: 0 calc(var(--st-default-spacing) * 4);
    padding: 0 calc(var(--st-spacing, var(--st-default-spacing)) * 4);
    padding-bottom: calc(var(--st-default-spacing) * 2);
    padding-bottom: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
  }

  .toggle-label {
    color: var(--primary-text-color);
    color: var(--st-toggle-label-color, var(--primary-text-color));
    margin-right: calc(var(--st-default-spacing) * 2);
    margin-right: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
    font-size: 16px;
    font-size: var(
      --st-font-size-toggle-label,
      var(--paper-font-subhead_-_font-size, 16px)
    );
  }

  .faults {
    display: flex;
    flex-direction: row;
    margin-left: calc(var(--st-default-spacing) * 2);
    margin-left: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
  }
  .fault-icon {
    padding: 2px;
    cursor: pointer;
    color: var(--secondary-background-color);
    color: var(--st-fault-inactive-color, var(--secondary-background-color));
  }
  .fault-icon.active {
    color: var(--accent-color);
    color: var(--st-fault-active-color, var(--accent-color));
  }
  .fault-icon.hide {
    display: none;
  }

  .sensors {
    display: grid;
    grid-gap: var(--st-default-spacing);
    grid-gap: var(--st-spacing, var(--st-default-spacing));
    font-size: 16px;
    font-size: var(
      --st-font-size-sensors,
      var(--paper-font-subhead_-_font-size, 16px)
    );
  }
  .sensors.as-list {
    grid-auto-flow: column;
    grid-template-columns: -webkit-min-content;
    grid-template-columns: min-content;
  }

  .sensors.as-table.without-labels {
    grid: auto-flow / 100%;
    align-items: start;
    justify-items: start;
    place-items: start;
  }

  .sensors.as-table.with-labels {
    grid: auto-flow / auto auto;
    align-items: start;
    justify-items: start;
    place-items: start;
  }

  .sensor-value {
    display: flex;
    align-items: center;
    padding-bottom: 4px;
  }
  .sensor-heading {
    font-weight: 300;
    padding-right: 8px;
    padding-bottom: 4px;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .sensors:empty {
    display: none;
  }
  header {
    display: flex;
    flex-direction: row;
    align-items: center;

    padding: calc(var(--st-default-spacing) * 6)
      calc(var(--st-default-spacing) * 4) calc(var(--st-default-spacing) * 4);

    padding: calc(var(--st-spacing, var(--st-default-spacing)) * 6)
      calc(var(--st-spacing, var(--st-default-spacing)) * 4)
      calc(var(--st-spacing, var(--st-default-spacing)) * 4);
  }
  .header__icon {
    margin-right: calc(var(--st-default-spacing) * 2);
    margin-right: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
    color: #44739e;
    color: var(--paper-item-icon-color, #44739e);
  }
  .header__title {
    font-size: 24px;
    font-size: var(--st-font-size-title, var(--ha-card-header-font-size, 24px));
    line-height: 24px;
    line-height: var(
      --st-font-size-title,
      var(--ha-card-header-font-size, 24px)
    );
    -webkit-font-smoothing: var(--paper-font-headline_-_-webkit-font-smoothing);
    font-weight: normal;
    margin: 0;
    align-self: left;
  }
  .current-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    overflow: hidden;
    flex-wrap: wrap;
  }
  .current-wrapper.row {
    flex-direction: row-reverse;
  }
  .current--value {
    display: flex;
    align-items: center;
    margin: 0;
    font-weight: 500;
    letter-spacing: -1px;
    line-height: var(--paper-font-display1_-_font-size);
    line-height: var(--st-font-size-l, var(--paper-font-display1_-_font-size));
    font-size: var(--paper-font-display1_-_font-size);
    font-size: var(--st-font-size-l, var(--paper-font-display1_-_font-size));
  }
  @media (min-width: 768px) {
    .current--value {
      font-size: var(--paper-font-display2_-_font-size);
      font-size: var(--st-font-size-xl, var(--paper-font-display2_-_font-size));
      line-height: var(--paper-font-display2_-_font-size);
      line-height: var(
        --st-font-size-xl,
        var(--paper-font-display2_-_font-size)
      );
    }
  }
  .current--value.updating {
    color: var(--error-color);
  }
  .current--unit {
    font-size: var(--paper-font-title_-_font-size);
    font-size: var(--st-font-size-m, var(--paper-font-title_-_font-size));
  }
  .thermostat-trigger {
    padding: 0px;
    border-radius: 50%;
    transition: background-color 0.2s ease, transform 0.1s ease;
  }
  .thermostat-trigger:hover {
    background-color: var(--secondary-background-color);
    transform: scale(1.1);
  }
  .thermostat-trigger:active {
    transform: scale(0.9);
  }
  .clickable {
    cursor: pointer;
  }
  .modes {
    display: grid;
    grid-template-columns: auto;
    grid-auto-flow: column;
    grid-gap: 2px;
    margin-top: calc(var(--st-default-spacing) * 2);
    margin-top: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
    padding: var(--st-default-spacing);
    padding: var(--st-spacing, var(--st-default-spacing));
  }
  .modes.heading {
    grid-template-columns: -webkit-min-content;
    grid-template-columns: min-content;
  }
  .mode-title {
    padding: 0 16px;
    align-self: center;
    justify-self: center;
    place-self: center;
    font-size: 16px;
    font-size: var(
      --st-font-size-sensors,
      var(--paper-font-subhead_-_font-size, 16px)
    );
    font-weight: 300;
    white-space: nowrap;
  }
  .mode-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-content: center;
    min-height: 24px;
    padding: var(--st-default-spacing) 0;
    padding: var(--st-spacing, var(--st-default-spacing)) 0;
    background: var(--secondary-background-color);
    background: var(--st-mode-background, var(--secondary-background-color));
    color: var(--secondary-text-color);
    cursor: pointer;
    border-radius: 12px;
    transition: background-color 0.2s ease, transform 0.1s ease, color 0.2s ease,
      box-shadow 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  .mode-item:hover {
    color: var(--primary-text-color);
    color: var(--st-mode-active-color, var(--primary-text-color));
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
  .mode-item:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .mode-item.active,
  .mode-item.active:hover {
    background: var(--primary-color);
    background: var(--st-mode-active-background, var(--primary-color));
    color: var(--text-primary-color);
    color: var(--st-mode-active-color, var(--text-primary-color));
    transform: translateY(0);
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.15);
  }
  .mode-item.active.off {
    background: var(--off-color);
    background: var(--st-mode-active-background, var(--off-color));
  }
  .mode-item.active.heat {
    background: var(--heat-color);
    background: var(--st-mode-active-background, var(--heat-color));
  }
  .mode-item.active.cool {
    background: var(--cool-color);
    background: var(--st-mode-active-background, var(--cool-color));
  }
  .mode-item.active.heat_cool {
    background: var(--heat_cool-color);
    background: var(--st-mode-active-background, var(--heat_cool-color));
  }
  .mode-item.active.auto {
    background: var(--auto-color);
    background: var(--st-mode-active-background, var(--auto-color));
  }
  .mode-item.active.dry {
    background: var(--dry-color);
    background: var(--st-mode-active-background, var(--dry-color));
  }
  .mode-item.active.fan_only {
    background: var(--fan_only-color);
    background: var(--st-mode-active-background, var(--fan_only-color));
  }
  .mode-icon {
    --iron-icon-width: 24px;
    --iron-icon-height: 24px;
    display: block;
  }
  ha-switch {
    padding: 16px 6px;
  }
  .side-by-side {
    display: flex;
    align-items: center;
  }
  .side-by-side > * {
    flex: 1;
    padding-right: 4px;
  }

  /* 
 * ==============================================================
 * ULTRA MODERN THEME (Glassmorphism + Glowing Interactions)
 * ==============================================================
 */

  ha-card.modern {
    background: rgba(30, 30, 40, 0.55);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 24px;
    overflow: visible;
  }

  ha-card.modern .header {
    padding-bottom: 8px;
  }

  ha-card.modern .header__title,
  ha-card.modern .header__icon {
    color: #ffffff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    font-weight: 600;
  }

  ha-card.modern .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
  }

  /* Sensors in modern theme */
  ha-card.modern .sensors {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    grid-gap: 12px;
    gap: 12px;
    margin-top: 8px;
    grid-template-columns: unset;
    width: 100%;
  }

  ha-card.modern .sensor-heading {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 400;
    padding: 0;
    margin: 0;
  }
  ha-card.modern .sensor-value {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: 600;
    padding: 0;
    margin: 2px 0 0 0;
  }

  /* 
 * Temperature Controls - Classic Style (Large Glowing Arrows)
 */
  ha-card.modern .current-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 16px 0;
    grid-gap: 0;
    gap: 0;
  }

  ha-card.modern .current--value {
    color: #ffffff;
    font-size: 64px;
    font-weight: 300;
    line-height: 1;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
    margin: 8px 0;
    letter-spacing: -2px;
  }

  ha-card.modern .thermostat-trigger {
    color: rgba(80, 180, 255, 0.8);
    background: transparent;
    border: none;
    box-shadow: none;
    margin: 0;
    padding: 4px;
    transition: all 0.25s ease;
    --mdc-icon-size: 48px;
  }

  ha-card.modern .thermostat-trigger ha-icon {
    --mdc-icon-size: 48px;
    filter: drop-shadow(0 0 8px rgba(80, 180, 255, 0.5));
  }

  ha-card.modern .thermostat-trigger:hover {
    color: rgba(100, 200, 255, 1);
    background: transparent;
    border: none;
    box-shadow: none;
    transform: scale(1.15);
  }

  ha-card.modern .thermostat-trigger:hover ha-icon {
    filter: drop-shadow(0 0 16px rgba(80, 180, 255, 0.8));
  }

  /* Mode Buttons - Glass Pill Container */
  ha-card.modern .modes {
    display: flex;
    justify-content: center;
    grid-gap: 0;
    gap: 0;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    padding: 6px;
    margin-top: 8px;
  }

  ha-card.modern .mode-item {
    flex: 1;
    flex-direction: row;
    background: transparent;
    border: none;
    border-radius: 14px;
    color: rgba(255, 255, 255, 0.5);
    padding: 10px 8px;
    font-weight: 500;
    font-size: 13px;
    box-shadow: none;
    min-height: auto;
    grid-gap: 6px;
    gap: 6px;
    transition: all 0.25s ease;
  }

  ha-card.modern .mode-item .mode-icon {
    --iron-icon-width: 18px;
    --iron-icon-height: 18px;
  }

  ha-card.modern .mode-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
  }

  ha-card.modern .mode-item.active {
    background: rgba(43, 154, 249, 0.25);
    border: none;
    color: #ffffff;
    box-shadow: 0 0 20px rgba(43, 154, 249, 0.35),
      0 0 8px rgba(43, 154, 249, 0.2);
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
  }
  ha-card.modern .mode-item.active.heat {
    background: rgba(255, 129, 0, 0.25);
    box-shadow: 0 0 20px rgba(255, 129, 0, 0.35), 0 0 8px rgba(255, 129, 0, 0.2);
  }

  /* 
 * Style: Classic - Large centered number with glowing arrows
 */
  ha-card.modern.style-classic .current-wrapper {
    flex-direction: column;
    align-items: center;
  }

  /* 
 * Style: Dial - Arc ring around temperature
 */
  ha-card.modern.style-dial .current-wrapper {
    position: relative;
    width: 220px;
    height: 220px;
    margin: 16px auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  /* The arc ring using conic-gradient */
  ha-card.modern.style-dial .current-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    padding: 6px;
    background: conic-gradient(
      from 135deg,
      rgba(80, 180, 255, 0.15) 0deg,
      rgba(43, 154, 249, 0.6) 120deg,
      rgba(43, 154, 249, 0.9) 200deg,
      rgba(80, 180, 255, 0.15) 270deg,
      transparent 270deg
    );
    -webkit-mask: linear-gradient(#fff 0, #fff 0) content-box,
      linear-gradient(#fff 0, #fff 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    filter: drop-shadow(0 0 12px rgba(43, 154, 249, 0.4));
    pointer-events: none;
  }

  /* Inner glow for the dial */
  ha-card.modern.style-dial .current-wrapper::after {
    content: '';
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    bottom: 12px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(43, 154, 249, 0.05) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  ha-card.modern.style-dial .current--value {
    font-size: 52px;
    margin: 0;
    z-index: 2;
  }

  ha-card.modern.style-dial .thermostat-trigger {
    z-index: 3;
    --mdc-icon-size: 36px;
  }

  ha-card.modern.style-dial .thermostat-trigger ha-icon {
    --mdc-icon-size: 36px;
    filter: drop-shadow(0 0 6px rgba(80, 180, 255, 0.4));
  }

  /* Editor Styles */
  .card-config {
    display: flex;
    flex-direction: column;
  }
  .overall-config {
    margin-bottom: 20px;
  }
  .side-by-side {
    display: flex;
    flex-direction: row;
    align-items: center;
    grid-gap: 16px;
    gap: 16px;
    margin-bottom: 16px;
  }
  .side-by-side > * {
    flex: 1;
  }

  .overall-config > ha-formfield {
    display: block;
    margin-bottom: 8px;
  }
`
styleInject(css_248z)

function formatNumber(number, { decimals = 1, fallback = 'N/A' } = {}) {
  const type = typeof number
  if (
    number === null ||
    number === '' ||
    ['boolean', 'undefined'].includes(type)
  ) {
    return fallback
  }
  return Number(number).toFixed(decimals)
}

function renderHeader({
  header,
  toggleEntityChanged,
  entity,
  openEntityPopover,
}) {
  var _a, _b
  if (header === false) {
    return nothing
  }
  const action = entity.attributes.hvac_action || entity.state
  let icon = header.icon
  if (typeof header.icon === 'object') {
    icon =
      (_a = icon === null || icon === void 0 ? void 0 : icon[action]) !==
        null && _a !== void 0
        ? _a
        : false
  }
  const name =
    (_b = header === null || header === void 0 ? void 0 : header.name) !==
      null && _b !== void 0
      ? _b
      : false
  return html`
    <header>
      <div
        style="display: flex;"
        class="clickable"
        @click=${() => openEntityPopover()}
      >
        ${renderIcon(icon)} ${renderName(name)}
      </div>
      ${renderFaults(header.faults, openEntityPopover)}
      ${renderToggle(header.toggle, openEntityPopover, toggleEntityChanged)}
    </header>
  `
}
function renderIcon(icon) {
  return icon
    ? html` <ha-icon class="header__icon" .icon=${icon}></ha-icon> `
    : nothing
}
function renderName(name) {
  return name ? html`<h2 class="header__title">${name}</h2>` : nothing
}
function renderFaults(faults, openEntityPopover) {
  if (faults.length === 0) {
    return nothing
  }
  const faultHtml = faults.map(({ icon, hide_inactive, state }) => {
    return html` <ha-icon
      class="fault-icon ${state.state === 'on'
        ? 'active'
        : hide_inactive
        ? ' hide'
        : ''}"
      icon="${icon || state.attributes.icon}"
      @click="${() => openEntityPopover(state.entity_id)}"
    ></ha-icon>`
  })
  return html` <div class="faults">${faultHtml}</div>`
}
function renderToggle(toggle, openEntityPopover, toggleEntityChanged) {
  var _a
  if (!toggle) return nothing
  return html`
    <div style="margin-left: auto;">
      <span
        class="clickable toggle-label"
        @click=${() => openEntityPopover(toggle.entity.entity_id)}
        >${toggle.label}
      </span>
      <ha-switch
        .checked=${((_a = toggle.entity) === null || _a === void 0
          ? void 0
          : _a.state) === 'on'}
        @change=${toggleEntityChanged}
      ></ha-switch>
    </div>
  `
}

var commonjsGlobal =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : typeof self !== 'undefined'
    ? self
    : {}

function createCommonjsModule(fn) {
  var module = { exports: {} }
  return fn(module, module.exports), module.exports
}

var squirrelly_min = createCommonjsModule(function (module, exports) {
  !(function (e, t) {
    t(exports)
  })(commonjsGlobal, function (e) {
    function t(e) {
      var n,
        r,
        a = new Error(e)
      return (
        (n = a),
        (r = t.prototype),
        Object.setPrototypeOf ? Object.setPrototypeOf(n, r) : (n.__proto__ = r),
        a
      )
    }
    function n(e, n, r) {
      var a = n.slice(0, r).split(/\n/),
        i = a.length,
        s = a[i - 1].length + 1
      throw t(
        (e +=
          ' at line ' +
          i +
          ' col ' +
          s +
          ':\n\n  ' +
          n.split(/\n/)[i - 1] +
          '\n  ' +
          Array(s).join(' ') +
          '^')
      )
    }
    t.prototype = Object.create(Error.prototype, {
      name: { value: 'Squirrelly Error', enumerable: !1 },
    })
    var r = new Function('return this')().Promise,
      a = !1
    try {
      a = new Function('return (async function(){}).constructor')()
    } catch (e) {
      if (!(e instanceof SyntaxError)) throw e
    }
    function i(e, t) {
      return Object.prototype.hasOwnProperty.call(e, t)
    }
    function s(e, t, n) {
      for (var r in t)
        i(t, r) &&
          (null == t[r] ||
          'object' != typeof t[r] ||
          ('storage' !== r && 'prefixes' !== r) ||
          n
            ? (e[r] = t[r])
            : (e[r] = s({}, t[r])))
      return e
    }
    var c = /^async +/,
      o = /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g,
      l = /'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g,
      f = /"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g,
      u = /[.*+\-?^${}()|[\]\\]/g
    function p(e) {
      return u.test(e) ? e.replace(u, '\\$&') : e
    }
    function h(e, r) {
      r.rmWhitespace &&
        (e = e.replace(/[\r\n]+/g, '\n').replace(/^\s+|\s+$/gm, '')),
        (o.lastIndex = 0),
        (l.lastIndex = 0),
        (f.lastIndex = 0)
      var a = r.prefixes,
        i = [a.h, a.b, a.i, a.r, a.c, a.e].reduce(function (e, t) {
          return e && t ? e + '|' + p(t) : t ? p(t) : e
        }, ''),
        s = new RegExp(
          '([|()]|=>)|(\'|"|`|\\/\\*)|\\s*((\\/)?(-|_)?' + p(r.tags[1]) + ')',
          'g'
        ),
        u = new RegExp(
          '([^]*?)' + p(r.tags[0]) + '(-|_)?\\s*(' + i + ')?\\s*',
          'g'
        ),
        h = 0,
        d = !1
      function g(t, a) {
        var i,
          p = { f: [] },
          g = 0,
          v = 'c'
        function m(t) {
          var a = e.slice(h, t),
            i = a.trim()
          if ('f' === v)
            'safe' === i
              ? (p.raw = !0)
              : r.async && c.test(i)
              ? ((i = i.replace(c, '')), p.f.push([i, '', !0]))
              : p.f.push([i, ''])
          else if ('fp' === v) p.f[p.f.length - 1][1] += i
          else if ('err' === v) {
            if (i) {
              var s = a.search(/\S/)
              n('invalid syntax', e, h + s)
            }
          } else p[v] = i
          h = t + 1
        }
        for (
          'h' === a || 'b' === a || 'c' === a
            ? (v = 'n')
            : 'r' === a && ((p.raw = !0), (a = 'i')),
            s.lastIndex = h;
          null !== (i = s.exec(e));

        ) {
          var y = i[1],
            x = i[2],
            b = i[3],
            w = i[4],
            F = i[5],
            S = i.index
          if (y)
            '(' === y
              ? (0 === g &&
                  ('n' === v
                    ? (m(S), (v = 'p'))
                    : 'f' === v && (m(S), (v = 'fp'))),
                g++)
              : ')' === y
              ? 0 === --g && 'c' !== v && (m(S), (v = 'err'))
              : 0 === g && '|' === y
              ? (m(S), (v = 'f'))
              : '=>' === y && (m(S), (h += 1), (v = 'res'))
          else if (x) {
            if ('/*' === x) {
              var I = e.indexOf('*/', s.lastIndex)
              ;-1 === I && n('unclosed comment', e, i.index),
                (s.lastIndex = I + 2)
            } else if ("'" === x) {
              ;(l.lastIndex = i.index),
                l.exec(e)
                  ? (s.lastIndex = l.lastIndex)
                  : n('unclosed string', e, i.index)
            } else if ('"' === x) {
              ;(f.lastIndex = i.index),
                f.exec(e)
                  ? (s.lastIndex = f.lastIndex)
                  : n('unclosed string', e, i.index)
            } else if ('`' === x) {
              ;(o.lastIndex = i.index),
                o.exec(e)
                  ? (s.lastIndex = o.lastIndex)
                  : n('unclosed string', e, i.index)
            }
          } else if (b)
            return (
              m(S),
              (h = S + i[0].length),
              (u.lastIndex = h),
              (d = F),
              w && 'h' === a && (a = 's'),
              (p.t = a),
              p
            )
        }
        return n('unclosed tag', e, t), p
      }
      var v = (function i(s, o) {
        ;(s.b = []), (s.d = [])
        var l,
          f = !1,
          p = []
        function v(e, t) {
          e &&
            (e = (function (e, t, n, r) {
              var a, i
              return (
                'string' == typeof t.autoTrim
                  ? (a = i = t.autoTrim)
                  : Array.isArray(t.autoTrim) &&
                    ((a = t.autoTrim[1]), (i = t.autoTrim[0])),
                (n || !1 === n) && (a = n),
                (r || !1 === r) && (i = r),
                'slurp' === a && 'slurp' === i
                  ? e.trim()
                  : ('_' === a || 'slurp' === a
                      ? (e = String.prototype.trimLeft
                          ? e.trimLeft()
                          : e.replace(/^[\s\uFEFF\xA0]+/, ''))
                      : ('-' !== a && 'nl' !== a) ||
                        (e = e.replace(/^(?:\n|\r|\r\n)/, '')),
                    '_' === i || 'slurp' === i
                      ? (e = String.prototype.trimRight
                          ? e.trimRight()
                          : e.replace(/[\s\uFEFF\xA0]+$/, ''))
                      : ('-' !== i && 'nl' !== i) ||
                        (e = e.replace(/(?:\n|\r|\r\n)$/, '')),
                    e)
              )
            })(e, r, d, t)) &&
            ((e = e.replace(/\\|'/g, '\\$&').replace(/\r\n|\n|\r/g, '\\n')),
            p.push(e))
        }
        for (; null !== (l = u.exec(e)); ) {
          var m,
            y = l[1],
            x = l[2],
            b = l[3] || ''
          for (var w in a)
            if (a[w] === b) {
              m = w
              break
            }
          v(y, x),
            (h = l.index + l[0].length),
            m || n('unrecognized tag type: ' + b, e, h)
          var F = g(l.index, m),
            S = F.t
          if ('h' === S) {
            var I = F.n || ''
            r.async && c.test(I) && ((F.a = !0), (F.n = I.replace(c, ''))),
              (F = i(F)),
              p.push(F)
          } else if ('c' === S) {
            if (s.n === F.n) return f ? ((f.d = p), s.b.push(f)) : (s.d = p), s
            n("Helper start and end don't match", e, l.index + l[0].length)
          } else if ('b' === S) {
            f ? ((f.d = p), s.b.push(f)) : (s.d = p)
            var R = F.n || ''
            r.async && c.test(R) && ((F.a = !0), (F.n = R.replace(c, ''))),
              (f = F),
              (p = [])
          } else if ('s' === S) {
            var T = F.n || ''
            r.async && c.test(T) && ((F.a = !0), (F.n = T.replace(c, ''))),
              p.push(F)
          } else p.push(F)
        }
        if (!o) throw t('unclosed helper "' + s.n + '"')
        return v(e.slice(h, e.length), !1), (s.d = p), s
      })({ f: [] }, !0)
      if (r.plugins)
        for (var m = 0; m < r.plugins.length; m++) {
          var y = r.plugins[m]
          y.processAST && (v.d = y.processAST(v.d, r))
        }
      return v.d
    }
    function d(e, t) {
      var n = h(e, t),
        r =
          "var tR='';" +
          (t.useWith ? 'with(' + t.varName + '||{}){' : '') +
          x(n, t) +
          'if(cb){cb(null,tR)} return tR' +
          (t.useWith ? '}' : '')
      if (t.plugins)
        for (var a = 0; a < t.plugins.length; a++) {
          var i = t.plugins[a]
          i.processFnString && (r = i.processFnString(r, t))
        }
      return r
    }
    function g(e, t) {
      for (var n = 0; n < t.length; n++) {
        var r = t[n][0],
          a = t[n][1]
        ;(e = (t[n][2] ? 'await ' : '') + "c.l('F','" + r + "')(" + e),
          a && (e += ',' + a),
          (e += ')')
      }
      return e
    }
    function v(e, t, n, r, a, i) {
      var s =
        '{exec:' + (a ? 'async ' : '') + y(n, t, e) + ',params:[' + r + ']'
      return (
        i && (s += ",name:'" + i + "'"), a && (s += ',async:true'), (s += '}')
      )
    }
    function m(e, t) {
      for (var n = '[', r = 0; r < e.length; r++) {
        var a = e[r]
        ;(n += v(t, a.res || '', a.d, a.p || '', a.a, a.n)),
          r < e.length && (n += ',')
      }
      return (n += ']')
    }
    function y(e, t, n) {
      return 'function(' + t + "){var tR='';" + x(e, n) + 'return tR}'
    }
    function x(e, t) {
      for (var n = 0, r = e.length, a = ''; n < r; n++) {
        var i = e[n]
        if ('string' == typeof i) {
          a += "tR+='" + i + "';"
        } else {
          var s = i.t,
            c = i.c || '',
            o = i.f,
            l = i.n || '',
            f = i.p || '',
            u = i.res || '',
            p = i.b,
            h = !!i.a
          if ('i' === s) {
            t.defaultFilter &&
              (c = "c.l('F','" + t.defaultFilter + "')(" + c + ')')
            var d = g(c, o)
            !i.raw && t.autoEscape && (d = "c.l('F','e')(" + d + ')'),
              (a += 'tR+=' + d + ';')
          } else if ('h' === s)
            if (t.storage.nativeHelpers.get(l))
              a += t.storage.nativeHelpers.get(l)(i, t)
            else {
              var y =
                (h ? 'await ' : '') +
                "c.l('H','" +
                l +
                "')(" +
                v(t, u, i.d, f, h)
              ;(y += p ? ',' + m(p, t) : ',[]'),
                (a += 'tR+=' + g((y += ',c)'), o) + ';')
            }
          else
            's' === s
              ? (a +=
                  'tR+=' +
                  g(
                    (h ? 'await ' : '') +
                      "c.l('H','" +
                      l +
                      "')({params:[" +
                      f +
                      ']},[],c)',
                    o
                  ) +
                  ';')
              : 'e' === s && (a += c + '\n')
        }
      }
      return a
    }
    var b = (function () {
      function e(e) {
        this.cache = e
      }
      return (
        (e.prototype.define = function (e, t) {
          this.cache[e] = t
        }),
        (e.prototype.get = function (e) {
          return this.cache[e]
        }),
        (e.prototype.remove = function (e) {
          delete this.cache[e]
        }),
        (e.prototype.reset = function () {
          this.cache = {}
        }),
        (e.prototype.load = function (e) {
          s(this.cache, e, !0)
        }),
        e
      )
    })()
    function w(e, n, r, a) {
      if (n && n.length > 0)
        throw t(
          (a ? 'Native' : '') + "Helper '" + e + "' doesn't accept blocks"
        )
      if (r && r.length > 0)
        throw t(
          (a ? 'Native' : '') + "Helper '" + e + "' doesn't accept filters"
        )
    }
    var F = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    function S(e) {
      return F[e]
    }
    var I = new b({}),
      R = new b({
        each: function (e, t) {
          var n = '',
            r = e.params[0]
          if ((w('each', t, !1), e.async))
            return new Promise(function (t) {
              !(function e(t, n, r, a, i) {
                r(t[n], n).then(function (s) {
                  ;(a += s), n === t.length - 1 ? i(a) : e(t, n + 1, r, a, i)
                })
              })(r, 0, e.exec, n, t)
            })
          for (var a = 0; a < r.length; a++) n += e.exec(r[a], a)
          return n
        },
        foreach: function (e, t) {
          var n = e.params[0]
          if ((w('foreach', t, !1), e.async))
            return new Promise(function (t) {
              !(function e(t, n, r, a, i, s) {
                a(n[r], t[n[r]]).then(function (c) {
                  ;(i += c), r === n.length - 1 ? s(i) : e(t, n, r + 1, a, i, s)
                })
              })(n, Object.keys(n), 0, e.exec, '', t)
            })
          var r = ''
          for (var a in n) i(n, a) && (r += e.exec(a, n[a]))
          return r
        },
        include: function (e, n, r) {
          w('include', n, !1)
          var a = r.storage.templates.get(e.params[0])
          if (!a) throw t('Could not fetch template "' + e.params[0] + '"')
          return a(e.params[1], r)
        },
        extends: function (e, n, r) {
          var a = e.params[1] || {}
          a.content = e.exec()
          for (var i = 0; i < n.length; i++) {
            var s = n[i]
            a[s.name] = s.exec()
          }
          var c = r.storage.templates.get(e.params[0])
          if (!c) throw t('Could not fetch template "' + e.params[0] + '"')
          return c(a, r)
        },
        useScope: function (e, t) {
          return w('useScope', t, !1), e.exec(e.params[0])
        },
      }),
      T = new b({
        if: function (e, t) {
          w('if', !1, e.f, !0)
          var n = 'if(' + e.p + '){' + x(e.d, t) + '}'
          if (e.b)
            for (var r = 0; r < e.b.length; r++) {
              var a = e.b[r]
              'else' === a.n
                ? (n += 'else{' + x(a.d, t) + '}')
                : 'elif' === a.n &&
                  (n += 'else if(' + a.p + '){' + x(a.d, t) + '}')
            }
          return n
        },
        try: function (e, n) {
          if (
            (w('try', !1, e.f, !0),
            !e.b || 1 !== e.b.length || 'catch' !== e.b[0].n)
          )
            throw t("native helper 'try' only accepts 1 block, 'catch'")
          var r = 'try{' + x(e.d, n) + '}',
            a = e.b[0]
          return (r +=
            'catch' + (a.res ? '(' + a.res + ')' : '') + '{' + x(a.d, n) + '}')
        },
        block: function (e, t) {
          return (
            w('block', e.b, e.f, !0),
            'if(!' +
              t.varName +
              '[' +
              e.p +
              ']){tR+=(' +
              y(e.d, '', t) +
              ')()}else{tR+=' +
              t.varName +
              '[' +
              e.p +
              ']}'
          )
        },
      }),
      E = new b({
        e: function (e) {
          var t = String(e)
          return /[&<>"']/.test(t) ? t.replace(/[&<>"']/g, S) : t
        },
      }),
      j = {
        varName: 'it',
        autoTrim: [!1, 'nl'],
        autoEscape: !0,
        defaultFilter: !1,
        tags: ['{{', '}}'],
        l: function (e, n) {
          if ('H' === e) {
            var r = this.storage.helpers.get(n)
            if (r) return r
            throw t("Can't find helper '" + n + "'")
          }
          if ('F' === e) {
            var a = this.storage.filters.get(n)
            if (a) return a
            throw t("Can't find filter '" + n + "'")
          }
        },
        async: !1,
        storage: { helpers: R, nativeHelpers: T, filters: E, templates: I },
        prefixes: { h: '@', b: '#', i: '', r: '*', c: '/', e: '!' },
        cache: !1,
        plugins: [],
        useWith: !1,
      }
    function H(e, t) {
      var n = {}
      return s(n, j), t && s(n, t), e && s(n, e), n.l.bind(n), n
    }
    function O(e, n) {
      var r = H(n || {}),
        i = Function
      if (r.async) {
        if (!a) throw t("This environment doesn't support async/await")
        i = a
      }
      try {
        return new i(r.varName, 'c', 'cb', d(e, r))
      } catch (n) {
        throw n instanceof SyntaxError
          ? t(
              'Bad template syntax\n\n' +
                n.message +
                '\n' +
                Array(n.message.length + 1).join('=') +
                '\n' +
                d(e, r)
            )
          : n
      }
    }
    function _(e, t) {
      var n
      return t.cache && t.name && t.storage.templates.get(t.name)
        ? t.storage.templates.get(t.name)
        : ((n = 'function' == typeof e ? e : O(e, t)),
          t.cache && t.name && t.storage.templates.define(t.name, n),
          n)
    }
    j.l.bind(j),
      (e.compile = O),
      (e.compileScope = x),
      (e.compileScopeIntoFunction = y),
      (e.compileToString = d),
      (e.defaultConfig = j),
      (e.filters = E),
      (e.getConfig = H),
      (e.helpers = R),
      (e.nativeHelpers = T),
      (e.parse = h),
      (e.render = function (e, n, a, i) {
        var s = H(a || {})
        if (!s.async) return _(e, s)(n, s)
        if (!i) {
          if ('function' == typeof r)
            return new r(function (t, r) {
              try {
                t(_(e, s)(n, s))
              } catch (e) {
                r(e)
              }
            })
          throw t(
            "Please provide a callback function, this env doesn't support Promises"
          )
        }
        try {
          _(e, s)(n, s, i)
        } catch (e) {
          return i(e)
        }
      }),
      (e.templates = I),
      Object.defineProperty(e, '__esModule', { value: !0 })
  })
})

// For each part, remember the value that was last rendered to the part by the
// unsafeHTML directive, and the DocumentFragment that was last set as a value.
// The DocumentFragment is used as a unique key to check if the last value
// rendered to the part was with unsafeHTML. If not, we'll always re-render the
// value passed to unsafeHTML.
const previousValues = new WeakMap()
/**
 * Renders the result as HTML, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
const unsafeHTML = directive((value) => (part) => {
  if (!(part instanceof NodePart)) {
    throw new Error('unsafeHTML can only be used in text bindings')
  }
  const previousValue = previousValues.get(part)
  if (
    previousValue !== undefined &&
    isPrimitive(value) &&
    value === previousValue.value &&
    part.value === previousValue.fragment
  ) {
    return
  }
  const template = document.createElement('template')
  template.innerHTML = value // innerHTML casts to string internally
  const fragment = document.importNode(template.content, true)
  part.setValue(fragment)
  previousValues.set(part, { value, fragment })
})

const renderIcon$1 = (icon) => `<ha-icon icon="${icon}"></ha-icon>`
squirrelly_min.defaultConfig.autoEscape = false // Turns autoEscaping on
squirrelly_min.filters.define('icon', renderIcon$1)
squirrelly_min.filters.define('join', (arr, delimiter = ', ') =>
  arr.join(delimiter)
)
squirrelly_min.filters.define('css', (str, css) => {
  const styles = Object.entries(css).reduce((memo, [key, val]) => {
    return `${memo}${key}:${val};`
  }, '')
  return `<span style="${styles}">${str}</span>`
})
squirrelly_min.filters.define('debug', (data) => {
  try {
    return JSON.stringify(data)
  } catch (_a) {
    return `Not able to read valid JSON object from: ${data}`
  }
})
function wrapSensors(config, content) {
  var _a, _b
  const { type, labels: showLabels } =
    (_b =
      (_a = config === null || config === void 0 ? void 0 : config.layout) ===
        null || _a === void 0
        ? void 0
        : _a.sensors) !== null && _b !== void 0
      ? _b
      : {
          type: 'table',
          labels: true,
        }
  const classes = [
    showLabels ? 'with-labels' : 'without-labels',
    type === 'list' ? 'as-list' : 'as-table',
  ]
  return html` <div class="sensors ${classes.join(' ')}">${content}</div> `
}
function renderTemplated({
  context,
  entityId,
  template = '{{state.text}}',
  label,
  hass,
  variables = {},
  config,
  localize,
  openEntityPopover,
}) {
  var _a, _b
  const { state, attributes } = context
  const [domain] = entityId.split('.')
  const lang = hass.selectedLanguage || hass.language
  const trPrefix = 'ui.card.climate.'
  const translations = Object.entries(hass.resources[lang]).reduce(
    (memo, [key, value]) => {
      if (key.startsWith(trPrefix)) memo[key.replace(trPrefix, '')] = value
      return memo
    },
    {}
  )
  // Prepare data to inject as variables into the template
  const data = Object.assign(Object.assign({}, attributes), {
    state: {
      raw: state,
      text: localize(state, `component.${domain}.state._.`),
    },
    ui: translations,
    v: variables,
  })
  // Need to define these inside the function to be able to reach local scope
  squirrelly_min.filters.define(
    'formatNumber',
    (str, opts = { decimals: config.decimals }) => {
      return String(formatNumber(str, opts))
    }
  )
  squirrelly_min.filters.define('relativetime', (str, opts = {}) => {
    return `<ha-relative-time fwd-datetime=${str} with-hass></ha-relative-time>`
  })
  squirrelly_min.filters.define('translate', (str, prefix = '') => {
    if (!prefix && (domain === 'climate' || domain === 'humidifier')) {
      return localize(str, `state_attributes.${domain}.${str}`)
    }
    return localize(str, prefix)
  })
  const render = (template) =>
    squirrelly_min.render(template, data, { useWith: true })
  const value = render(template)
  if (
    label === false ||
    ((_b =
      (_a = config === null || config === void 0 ? void 0 : config.layout) ===
        null || _a === void 0
        ? void 0
        : _a.sensors) === null || _b === void 0
      ? void 0
      : _b.labels) === false
  ) {
    return html`<div class="sensor-value">${unsafeHTML(value)}</div>`
  }
  const safeLabel = label || '{{friendly_name}}'
  const heading = safeLabel.match(/^(mdi|hass):.*/)
    ? renderIcon$1(safeLabel)
    : render(safeLabel)
  return html`
    <div class="sensor-heading">${unsafeHTML(heading)}</div>
    <div class="sensor-value">${unsafeHTML(value)}</div>
  `
}

// Preset mode can be  one of: none, eco, away, boost, comfort, home, sleep, activity
// See https://github.com/home-assistant/home-assistant/blob/dev/homeassistant/components/climate/const.py#L36-L57
function renderInfoItem({
  hide = false,
  hass,
  state,
  details,
  localize,
  openEntityPopover,
}) {
  var _a, _b
  if (hide || typeof state === 'undefined') return
  const { type, heading, icon, unit, decimals } = details
  let valueCell
  if (process.env.DEBUG) {
    console.log('ST: infoItem', { state, details })
  }
  if (type === 'relativetime') {
    valueCell = html`
      <div class="sensor-value">
        <ha-relative-time .datetime=${state} .hass=${hass}></ha-relative-time>
      </div>
    `
  } else if (typeof state === 'object') {
    const [domain] = state.entity_id.split('.')
    const prefix = [
      'component',
      domain,
      'state',
      (_b =
        (_a = state.attributes) === null || _a === void 0
          ? void 0
          : _a.device_class) !== null && _b !== void 0
        ? _b
        : '_',
      '',
    ].join('.')
    let value = localize(state.state, prefix)
    if (typeof decimals === 'number') {
      value = formatNumber(value, { decimals })
    }
    valueCell = html`
      <div
        class="sensor-value clickable"
        @click="${() => openEntityPopover(state.entity_id)}"
      >
        ${value} ${unit || state.attributes.unit_of_measurement}
      </div>
    `
  } else {
    let value =
      typeof decimals === 'number' ? formatNumber(state, { decimals }) : state
    valueCell = html` <div class="sensor-value">${value}${unit}</div> `
  }
  if (heading === false) {
    return valueCell
  }
  const headingResult = icon
    ? html` <ha-icon icon="${icon}"></ha-icon> `
    : html` ${heading}: `
  return html`
    <div class="sensor-heading">${headingResult}</div>
    ${valueCell}
  `
}

function renderSensors({
  _hide,
  entity,
  unit,
  hass,
  sensors,
  config,
  localize,
  openEntityPopover,
}) {
  var _a, _b, _c, _d, _e, _f, _g
  const {
    state,
    attributes: { hvac_action: action, current_temperature: current },
  } = entity
  const showLabels =
    (_c =
      (_b =
        (_a = config === null || config === void 0 ? void 0 : config.layout) ===
          null || _a === void 0
          ? void 0
          : _a.sensors) === null || _b === void 0
        ? void 0
        : _b.labels) !== null && _c !== void 0
      ? _c
      : true
  let stateString = localize(state, 'component.climate.state._.')
  if (action) {
    stateString = [
      localize(action, 'state_attributes.climate.hvac_action.'),
      ` (${stateString})`,
    ].join('')
  }
  const sensorHtml = [
    renderInfoItem({
      hide: _hide.temperature,
      state: `${formatNumber(current, config)}${unit || ''}`,
      hass,
      details: {
        heading: showLabels
          ? (_e =
              (_d =
                config === null || config === void 0
                  ? void 0
                  : config.label) === null || _d === void 0
                ? void 0
                : _d.temperature) !== null && _e !== void 0
            ? _e
            : localize('ui.card.climate.currently')
          : false,
      },
    }),
    renderInfoItem({
      hide: _hide.state,
      state: stateString,
      hass,
      details: {
        heading: showLabels
          ? (_g =
              (_f =
                config === null || config === void 0
                  ? void 0
                  : config.label) === null || _f === void 0
                ? void 0
                : _f.state) !== null && _g !== void 0
            ? _g
            : localize('ui.panel.lovelace.editor.card.generic.state')
          : false,
      },
    }),
    ...(sensors.map((_a) => {
      var { name, state } = _a,
        rest = __rest(_a, ['name', 'state'])
      return renderInfoItem({
        state,
        hass,
        localize,
        openEntityPopover,
        details: Object.assign(Object.assign({}, rest), {
          heading: showLabels && name,
        }),
      })
    }) || null),
  ].filter((it) => it !== null)
  return wrapSensors(config, sensorHtml)
}

var HVAC_MODES
;(function (HVAC_MODES) {
  HVAC_MODES['OFF'] = 'off'
  HVAC_MODES['HEAT'] = 'heat'
  HVAC_MODES['COOL'] = 'cool'
  HVAC_MODES['HEAT_COOL'] = 'heat_cool'
  HVAC_MODES['AUTO'] = 'auto'
  HVAC_MODES['DRY'] = 'dry'
  HVAC_MODES['FAN_ONLY'] = 'fan_only'
})(HVAC_MODES || (HVAC_MODES = {}))

function renderModeType({
  state,
  mode: options,
  modeOptions,
  localize,
  setMode,
}) {
  var _a
  const { type, hide_when_off, mode = 'none', list, name } = options
  if (list.length === 0 || (hide_when_off && state === HVAC_MODES.OFF)) {
    return null
  }
  let localizePrefix = `state_attributes.climate.${type}_mode.`
  if (type === 'hvac') {
    localizePrefix = `component.climate.state._.`
  }
  const maybeRenderName = (name) => {
    if (name === false) return null
    if (
      (modeOptions === null || modeOptions === void 0
        ? void 0
        : modeOptions.names) === false
    )
      return null
    return localize(name, localizePrefix)
  }
  const maybeRenderIcon = (icon) => {
    if (!icon) return null
    if (
      (modeOptions === null || modeOptions === void 0
        ? void 0
        : modeOptions.icons) === false
    )
      return null
    return html` <ha-icon class="mode-icon" .icon=${icon}></ha-icon> `
  }
  const str = type == 'hvac' ? 'operation' : `${type}_mode`
  const title = name || localize(`ui.card.climate.${str}`)
  const headings =
    (_a =
      modeOptions === null || modeOptions === void 0
        ? void 0
        : modeOptions.headings) !== null && _a !== void 0
      ? _a
      : true
  return html`
    <div class="modes ${headings ? 'heading' : ''}">
      ${headings ? html` <div class="mode-title">${title}</div> ` : ''}
      ${list.map(
        ({ value, icon, name }) => html`
          <div
            class="mode-item ${value === mode ? 'active ' + mode : ''}"
            @click=${() => setMode(type, value)}
          >
            ${maybeRenderIcon(icon)} ${maybeRenderName(name)}
          </div>
        `
      )}
    </div>
  `
}

const STATE_ICONS = {
  auto: 'mdi:radiator',
  cooling: 'mdi:snowflake',
  fan: 'mdi:fan',
  heating: 'mdi:radiator',
  idle: 'mdi:radiator-disabled',
  off: 'mdi:radiator-off',
}
const MODE_ICONS = {
  auto: 'hass:autorenew',
  cool: 'hass:snowflake',
  dry: 'hass:water-percent',
  fan_only: 'hass:fan',
  heat_cool: 'hass:autorenew',
  heat: 'hass:fire',
  off: 'hass:power',
}
function parseHeaderConfig(config, entity, hass) {
  if (config === false) return false
  let name
  if (
    typeof (config === null || config === void 0 ? void 0 : config.name) ===
    'string'
  ) {
    name = config.name
  } else if (
    (config === null || config === void 0 ? void 0 : config.name) === false
  ) {
    name = false
  } else {
    name = entity.attributes.friendly_name
  }
  let icon = entity.attributes.hvac_action ? STATE_ICONS : MODE_ICONS
  if (
    typeof (config === null || config === void 0 ? void 0 : config.icon) !==
    'undefined'
  ) {
    icon = config.icon
  }
  return {
    name,
    icon,
    toggle: (config === null || config === void 0 ? void 0 : config.toggle)
      ? parseToggle(config.toggle, hass)
      : null,
    faults: parseFaults(
      config === null || config === void 0 ? void 0 : config.faults,
      hass
    ),
  }
}
function parseToggle(config, hass) {
  var _a
  const entity = hass.states[config.entity]
  let label = ''
  if ((config === null || config === void 0 ? void 0 : config.name) === true) {
    label = entity.attributes.name
  } else {
    label =
      (_a = config === null || config === void 0 ? void 0 : config.name) !==
        null && _a !== void 0
        ? _a
        : ''
  }
  return { entity, label }
}
function parseFaults(config, hass) {
  if (Array.isArray(config)) {
    return config.map((_a) => {
      var { entity } = _a,
        rest = __rest(_a, ['entity'])
      return Object.assign(Object.assign({}, rest), {
        state: hass.states[entity],
        entity,
      })
    })
  }
  return []
}

const DUAL = 'dual'
const SINGLE = 'single'
function getEntityType(attributes) {
  if (
    typeof attributes.target_temp_high === 'number' &&
    typeof attributes.target_temp_low === 'number'
  ) {
    return DUAL
  }
  return SINGLE
}

const DUAL$1 = 'dual'
function parseSetpoints(setpoints, attributes) {
  if (setpoints === false) {
    return {}
  }
  if (setpoints) {
    const def = Object.keys(setpoints)
    return def.reduce((result, name) => {
      const sp = setpoints[name]
      if (sp === null || sp === void 0 ? void 0 : sp.hide) return result
      return Object.assign(Object.assign({}, result), {
        [name]:
          attributes === null || attributes === void 0
            ? void 0
            : attributes[name],
      })
    }, {})
  }
  const entityType = getEntityType(attributes)
  if (entityType === DUAL$1) {
    return {
      target_temp_low: attributes.target_temp_low,
      target_temp_high: attributes.target_temp_high,
    }
  }
  return {
    temperature: attributes.temperature,
  }
}

function parseServie(config) {
  if (!config) {
    return {
      domain: 'climate',
      service: 'set_temperature',
    }
  }
  return config
}

var MODES
;(function (MODES) {
  MODES['HVAC'] = 'hvac'
  MODES['FAN'] = 'fan'
  MODES['PRESET'] = 'preset'
  MODES['SWING'] = 'swing'
})(MODES || (MODES = {}))

const DEBOUNCE_TIMEOUT = 500
const STEP_SIZE = 0.5
const DECIMALS = 1
const MODE_TYPES = Object.values(MODES)
const DEFAULT_CONTROL = [MODES.HVAC, MODES.PRESET]
const ICONS = {
  UP: 'hass:chevron-up',
  DOWN: 'hass:chevron-down',
  PLUS: 'mdi:plus',
  MINUS: 'mdi:minus',
}
const DEFAULT_HIDE = {
  temperature: false,
  state: false,
}
function shouldShowModeControl(modeOption, config) {
  var _a
  if (typeof config[modeOption] === 'object') {
    const obj = config[modeOption]
    return obj.include !== false
  }
  return (_a =
    config === null || config === void 0 ? void 0 : config[modeOption]) !==
    null && _a !== void 0
    ? _a
    : true
}
function getModeList(type, attributes, specification = {}) {
  return attributes[`${type}_modes`]
    .filter((modeOption) => shouldShowModeControl(modeOption, specification))
    .map((modeOption) => {
      const values =
        typeof specification[modeOption] === 'object'
          ? specification[modeOption]
          : {}
      return Object.assign(
        { icon: MODE_ICONS[modeOption], value: modeOption, name: modeOption },
        values
      )
    })
}
class SimpleThermostat extends LitElement {
  constructor() {
    super(...arguments)
    this.modes = []
    this._hass = {}
    this.sensors = []
    this.showSensors = true
    this.name = ''
    this.stepSize = STEP_SIZE
    this._values = {}
    this._updatingValues = false
    this._hide = DEFAULT_HIDE
    this._debouncedSetTemperature = debounceFn(
      (values) => {
        const { domain, service, data = {} } = this.service
        this._hass.callService(
          domain,
          service,
          Object.assign(
            Object.assign({ entity_id: this.config.entity }, data),
            values
          )
        )
      },
      {
        wait: DEBOUNCE_TIMEOUT,
      }
    )
    this.localize = (label, prefix = '') => {
      var _a
      const lang = this._hass.selectedLanguage || this._hass.language
      const key = `${prefix}${label}`
      const translations = this._hass.resources[lang]
      return (_a =
        translations === null || translations === void 0
          ? void 0
          : translations[key]) !== null && _a !== void 0
        ? _a
        : label
    }
    this.toggleEntityChanged = (ev) => {
      var _a, _b, _c, _d
      if (
        !this.header ||
        !((_a = this === null || this === void 0 ? void 0 : this.header) ===
          null || _a === void 0
          ? void 0
          : _a.toggle)
      )
        return
      const el = ev.target
      this._hass.callService(
        'homeassistant',
        el.checked ? 'turn_on' : 'turn_off',
        {
          entity_id:
            (_d =
              (_c =
                (_b = this.header) === null || _b === void 0
                  ? void 0
                  : _b.toggle) === null || _c === void 0
                ? void 0
                : _c.entity) === null || _d === void 0
              ? void 0
              : _d.entity_id,
        }
      )
    }
    this.setMode = (type, mode) => {
      if (type && mode) {
        this._hass.callService('climate', `set_${type}_mode`, {
          entity_id: this.config.entity,
          [`${type}_mode`]: mode,
        })
        fireEvent(this, 'haptic', 'light')
      } else {
        fireEvent(this, 'haptic', 'failure')
      }
    }
    this.openEntityPopover = (entityId = null) => {
      fireEvent(this, 'hass-more-info', {
        entityId: entityId || this.config.entity,
      })
    }
  }
  static get styles() {
    return css_248z
  }
  static getConfigElement() {
    return window.document.createElement(`${name}-editor`)
  }
  setConfig(config) {
    this.config = Object.assign({ decimals: DECIMALS }, config)
  }
  updated() {
    super.connectedCallback()
    const patchHass = Array.from(
      this.renderRoot.querySelectorAll('[with-hass]')
    )
    for (const child of Array.from(patchHass)) {
      // Forward attributes to properties
      Array.from(child.attributes).forEach((attr) => {
        if (attr.name.startsWith('fwd-')) {
          child[attr.name.replace('fwd-', '')] = attr.value
        }
      })
      // Always forward hass
      child.hass = this._hass
    }
  }
  set hass(hass) {
    var _a, _b, _c, _d
    if (!this.config.entity) {
      return
    }
    const entity = hass.states[this.config.entity]
    if (typeof entity === undefined) {
      return
    }
    this._hass = hass
    if (this.entity !== entity) {
      this.entity = entity
    }
    this.header = parseHeaderConfig(this.config.header, entity, hass)
    this.service = parseServie(
      (_b =
        (_a = this.config) === null || _a === void 0 ? void 0 : _a.service) !==
        null && _b !== void 0
        ? _b
        : false
    )
    const attributes = entity.attributes
    let values = parseSetpoints(
      (_d =
        (_c = this.config) === null || _c === void 0
          ? void 0
          : _c.setpoints) !== null && _d !== void 0
        ? _d
        : null,
      attributes
    )
    // If we are updating the values, and they are now equal
    // we can safely assume we've been able to update the set points
    // in HA and remove the updating flag
    // If we are not updating we take the values we get from HA
    // because it means they changed elsewhere
    if (this._updatingValues && isEqual(values, this._values)) {
      this._updatingValues = false
    } else if (!this._updatingValues) {
      this._values = values
    }
    const supportedModeType = (type) =>
      MODE_TYPES.includes(type) && attributes[`${type}_modes`]
    const buildBasicModes = (items) => {
      return items.filter(supportedModeType).map((type) => ({
        type,
        hide_when_off: false,
        list: getModeList(type, attributes),
      }))
    }
    let controlModes = []
    if (this.config.control === false) {
      controlModes = []
    } else if (Array.isArray(this.config.control)) {
      controlModes = buildBasicModes(this.config.control)
    } else if (typeof this.config.control === 'object') {
      const entries = Object.entries(this.config.control)
      if (entries.length > 0) {
        controlModes = entries
          .filter(([type, def]) => supportedModeType(type) && def !== false)
          .map(([type, definition]) => {
            const { _name, _hide_when_off } = definition,
              controlField = __rest(definition, ['_name', '_hide_when_off'])
            return {
              type,
              hide_when_off: _hide_when_off,
              name: _name,
              list: getModeList(type, attributes, controlField),
            }
          })
      } else {
        controlModes = buildBasicModes(DEFAULT_CONTROL)
      }
    } else {
      controlModes = buildBasicModes(DEFAULT_CONTROL)
    }
    // Decorate mode types with active value and set to this.modes
    this.modes = controlModes.map((values) => {
      if (values.type === MODES.HVAC) {
        const sortedList = []
        const hvacModeValues = Object.values(HVAC_MODES)
        values.list.forEach((item) => {
          const index = hvacModeValues.indexOf(item.value)
          sortedList[index] = item
        })
        return Object.assign(Object.assign({}, values), {
          list: sortedList,
          mode: entity.state,
        })
      }
      const mode = attributes[`${values.type}_mode`]
      return Object.assign(Object.assign({}, values), { mode })
    })
    if (this.config.step_size) {
      this.stepSize = +this.config.step_size
    }
    if (this.config.hide) {
      this._hide = Object.assign(
        Object.assign({}, this._hide),
        this.config.hide
      )
    }
    if (this.config.sensors === false) {
      this.showSensors = false
    } else if (this.config.version === 3) {
      this.sensors = []
      const customSensors = this.config.sensors.map((sensor, index) => {
        var _a, _b
        const entityId =
          (_a =
            sensor === null || sensor === void 0 ? void 0 : sensor.entity) !==
            null && _a !== void 0
            ? _a
            : this.config.entity
        let context = this.entity
        if (sensor === null || sensor === void 0 ? void 0 : sensor.entity) {
          context = this._hass.states[sensor.entity]
        }
        return {
          id:
            (_b = sensor === null || sensor === void 0 ? void 0 : sensor.id) !==
              null && _b !== void 0
              ? _b
              : String(index),
          label: sensor === null || sensor === void 0 ? void 0 : sensor.label,
          template: sensor.template,
          show:
            (sensor === null || sensor === void 0 ? void 0 : sensor.show) !==
            false,
          entityId,
          context,
        }
      })
      const ids = customSensors.map((s) => s.id)
      const builtins = []
      if (!ids.includes('state')) {
        builtins.push({
          id: 'state',
          label: '{{ui.operation}}',
          template: '{{state.text}}',
          entityId: this.config.entity,
          context: this.entity,
        })
      }
      if (!ids.includes('temperature')) {
        builtins.push({
          id: 'temperature',
          label: '{{ui.currently}}',
          template: '{{current_temperature|formatNumber}}',
          entityId: this.config.entity,
          context: this.entity,
        })
      }
      this.sensors = [...builtins, ...customSensors]
    } else if (this.config.sensors) {
      this.sensors = this.config.sensors.map((_a) => {
        var _b
        var { name, entity, attribute, unit = '' } = _a,
          rest = __rest(_a, ['name', 'entity', 'attribute', 'unit'])
        let state
        const names = [name]
        if (entity) {
          state = hass.states[entity]
          names.push(
            (_b =
              state === null || state === void 0
                ? void 0
                : state.attributes) === null || _b === void 0
              ? void 0
              : _b.friendly_name
          )
          if (attribute) {
            state = state.attributes[attribute]
          }
        } else if (attribute && attribute in this.entity.attributes) {
          state = this.entity.attributes[attribute]
          names.push(attribute)
        }
        names.push(entity)
        return Object.assign(Object.assign({}, rest), {
          name: names.find((n) => !!n),
          state,
          entity,
          unit,
        })
      })
    }
  }
  render({ _hide, _values, _updatingValues, config, entity } = this) {
    var _a, _b, _c
    const warnings = []
    if (this.stepSize < 1 && this.config.decimals === 0) {
      warnings.push(html`
        <hui-warning>
          Decimals is set to 0 and step_size is lower than 1. Decrementing a
          setpoint will likely not work. Change one of the settings to clear
          this warning.
        </hui-warning>
      `)
    }
    if (!entity) {
      return html`
        <hui-warning> Entity not available: ${config.entity} </hui-warning>
      `
    }
    const {
      attributes: {
        min_temp: minTemp = null,
        max_temp: maxTemp = null,
        hvac_action: action,
      },
    } = entity
    const unit = this.getUnit()
    const stepLayout =
      (_c =
        (_b =
          (_a = this.config) === null || _a === void 0 ? void 0 : _a.layout) ===
          null || _b === void 0
          ? void 0
          : _b.step) !== null && _c !== void 0
        ? _c
        : 'column'
    const row = stepLayout === 'row'
    const classes = [
      !this.header && 'no-header',
      action,
      this.config.theme === 'modern' ? 'modern' : 'standard',
      this.config.theme === 'modern' && this.config.control_style === 'dial'
        ? 'style-dial'
        : 'style-classic',
    ].filter((cx) => !!cx)
    let sensorsHtml
    if (this.config.version === 3) {
      sensorsHtml = this.sensors
        .filter((spec) => spec.show !== false)
        .map((spec) => {
          return renderTemplated(
            Object.assign(Object.assign({}, spec), {
              variables: this.config.variables,
              hass: this._hass,
              config: this.config,
              localize: this.localize,
              openEntityPopover: this.openEntityPopover,
            })
          )
        })
      sensorsHtml = wrapSensors(this.config, sensorsHtml)
    } else {
      sensorsHtml = this.showSensors
        ? renderSensors({
            _hide: this._hide,
            unit,
            hass: this._hass,
            entity: this.entity,
            sensors: this.sensors,
            config: this.config,
            localize: this.localize,
            openEntityPopover: this.openEntityPopover,
          })
        : ''
    }
    return html`
      <ha-card class="${classes.join(' ')}">
        ${warnings}
        ${renderHeader({
          header: this.header,
          toggleEntityChanged: this.toggleEntityChanged,
          entity: this.entity,
          openEntityPopover: this.openEntityPopover,
        })}
        <section class="body">
          ${sensorsHtml}
          ${Object.entries(_values).map(([field, value]) => {
            const hasValue = ['string', 'number'].includes(typeof value)
            const showUnit = unit !== false && hasValue
            return html`
              <div class="current-wrapper ${stepLayout}">
                <ha-icon-button
                  ?disabled=${maxTemp !== null && value >= maxTemp}
                  class="thermostat-trigger"
                  icon=${row ? ICONS.PLUS : ICONS.UP}
                  @click="${() => this.setTemperature(this.stepSize, field)}"
                >
                  <ha-icon .icon=${row ? ICONS.PLUS : ICONS.UP}></ha-icon>
                </ha-icon-button>

                <h3
                  @click=${() => this.openEntityPopover()}
                  class="current--value ${_updatingValues
                    ? 'updating'
                    : nothing}"
                >
                  ${formatNumber(value, config)}
                  ${showUnit
                    ? html`<span class="current--unit">${unit}</span>`
                    : nothing}
                </h3>
                <ha-icon-button
                  ?disabled=${minTemp !== null && value <= minTemp}
                  class="thermostat-trigger"
                  icon=${row ? ICONS.MINUS : ICONS.DOWN}
                  @click="${() => this.setTemperature(-this.stepSize, field)}"
                >
                  <ha-icon .icon=${row ? ICONS.MINUS : ICONS.DOWN}></ha-icon>
                </ha-icon-button>
              </div>
            `
          })}
        </section>

        ${this.modes.map((mode) => {
          var _a, _b, _c
          return renderModeType({
            state: entity.state,
            mode,
            localize: this.localize,
            modeOptions:
              (_c =
                (_b =
                  (_a = this.config) === null || _a === void 0
                    ? void 0
                    : _a.layout) === null || _b === void 0
                  ? void 0
                  : _b.mode) !== null && _c !== void 0
                ? _c
                : {},
            setMode: this.setMode,
          })
        })}
      </ha-card>
    `
  }
  setTemperature(change, field) {
    this._updatingValues = true
    const previousValue = this._values[field]
    const newValue = Number(previousValue) + change
    const { decimals } = this.config
    this._values = Object.assign(Object.assign({}, this._values), {
      [field]: +formatNumber(newValue, { decimals }),
    })
    this._debouncedSetTemperature(this._values)
  }
  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 3
  }
  getUnit() {
    var _a, _b, _c, _d
    if (['boolean', 'string'].includes(typeof this.config.unit)) {
      return (_a = this.config) === null || _a === void 0 ? void 0 : _a.unit
    }
    return (_d =
      (_c =
        (_b = this._hass.config) === null || _b === void 0
          ? void 0
          : _b.unit_system) === null || _c === void 0
        ? void 0
        : _c.temperature) !== null && _d !== void 0
      ? _d
      : false
  }
}
__decorate([property()], SimpleThermostat.prototype, 'config', void 0)
__decorate([property()], SimpleThermostat.prototype, 'header', void 0)
__decorate([property()], SimpleThermostat.prototype, 'service', void 0)
__decorate([property()], SimpleThermostat.prototype, 'modes', void 0)
__decorate([property()], SimpleThermostat.prototype, 'entity', void 0)
__decorate([property()], SimpleThermostat.prototype, 'sensors', void 0)
__decorate([property()], SimpleThermostat.prototype, 'showSensors', void 0)
__decorate([property()], SimpleThermostat.prototype, 'name', void 0)
__decorate(
  [
    property({
      type: Object,
    }),
  ],
  SimpleThermostat.prototype,
  '_values',
  void 0
)
__decorate([property()], SimpleThermostat.prototype, '_updatingValues', void 0)
__decorate([property()], SimpleThermostat.prototype, '_hide', void 0)

customElements.define(name, SimpleThermostat)
customElements.define(`${name}-editor`, SimpleThermostatEditor)
console.info(`%c${name}: ${version}`, 'font-weight: bold')
window.customCards = window.customCards || []
window.customCards.push({
  type: name,
  name: 'Simple Thermostat Refresh',
  preview: false,
  description: 'A different take on the thermostat card',
})
