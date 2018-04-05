/**
 * Created by duncan on 4/4/18.
 * Produces a legend for a categorical attribute.
 */
import React from 'react';
import PropTypes from 'prop-types';
import DiscreteColorLegend from './discrete-color-legend'

import './discrete-legend.css';

CategoricalLegend.propTypes = {
    /** The name of the attribute. */
    title: PropTypes.string.isRequired,
    /** The categories in the attribute. */
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    /** The colors associated with each category. */
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    /** Background color of the legend. */
    background: PropTypes.string.isRequired,
    /** Initial width of the legend. */
    width: PropTypes.number,
    /** Initial height of the legend. */
    height: PropTypes.number,
    /** onClick function has string in categories array for arg. */
    onCategoryClick: PropTypes.func
};

export default function CategoricalLegend(
    {title, categories, colors, height, width, background, onCategoryClick}
) {
    
    return <DiscreteColorLegend
        title={title}
        items={categories}
        colors={colors}
        height={height}
        width={width}
        background={background}
        onItemClick={onCategoryClick}
    />
    
}

