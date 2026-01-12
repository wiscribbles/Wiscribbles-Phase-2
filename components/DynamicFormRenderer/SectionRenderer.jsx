//not being used additional component used earlier

'use client';

import React from 'react';
import FieldRenderer from './FieldRenderer';

/**
 * SectionRenderer - Renders a section of form fields
 * Handles section-level layout and conditional field display
 */
const SectionRenderer = ({
  section,
  formData,
  onFieldChange,
  errors,
  isNotaryMode = false,
  notaryEditableFields = [],
  methods,
  isCompact = false
}) => {
  if (!section || !section.fields) {
    return null;
  }

  const renderField = (field) => {
    // Check if field should be displayed based on conditional logic
    if (field.conditionalDisplay) {
      const { field: dependentField, value: requiredValue } = field.conditionalDisplay;
      const currentValue = formData[dependentField];
      if (currentValue !== requiredValue) {
        return null;
      }
    }

    // Determine if this field is editable in notary mode
    const isEditableInNotaryMode = isNotaryMode ? notaryEditableFields.includes(field.id) : true;

    return (
      <FieldRenderer
        key={field.id}
        field={field}
        value={formData[field.id]}
        onChange={(value) => onFieldChange(field.id, value)}
        error={errors[field.id]}
        isNotaryMode={isNotaryMode}
        isEditable={isEditableInNotaryMode}
        methods={methods}
        formData={formData}
        isCompact={isCompact}
      />
    );
  };

  const renderConditionalFields = (field, parentValue) => {
    if (!field.conditionalFields) return null;

    const conditionalFields = field.conditionalFields[parentValue];
    if (!conditionalFields) return null;

    return conditionalFields.map(condField => (
      <div key={condField.id} style={{ marginLeft: isCompact ? '10px' : '20px', marginTop: '10px' }}>
        <FieldRenderer
          field={condField}
          value={formData[condField.id]}
          onChange={(value) => onFieldChange(condField.id, value)}
          error={errors[condField.id]}
          isNotaryMode={isNotaryMode}
          isEditable={isNotaryMode ? notaryEditableFields.includes(condField.id) : true}
          methods={methods}
          formData={formData}
          isCompact={isCompact}
        />
      </div>
    ));
  };

  return (
    <div className={`section-renderer ${isCompact ? 'compact' : ''}`}>
      {/* Section Header */}
      {!isCompact && (
        <div className="section-header" style={{
          marginBottom: '25px',
          paddingBottom: '15px',
          borderBottom: '2px solid #E2E8F0'
        }}>
          <h3 style={{
            color: '#2D3748',
            fontSize: '22px',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            {section.title}
          </h3>
          {section.description && (
            <p style={{
              color: '#718096',
              fontSize: '14px',
              margin: 0,
              lineHeight: '1.5'
            }}>
              {section.description}
            </p>
          )}
        </div>
      )}

      {/* Compact Header for Video Call Mode */}
      {isCompact && (
        <div className="section-header-compact" style={{
          marginBottom: '15px',
          paddingBottom: '8px',
          borderBottom: '1px solid #E2E8F0'
        }}>
          <h4 style={{
            color: '#274171',
            fontSize: '16px',
            fontWeight: '600',
            margin: 0
          }}>
            {section.title}
          </h4>
        </div>
      )}

      {/* Section Fields */}
      <div className="section-fields">
        {section.fields.map(field => (
          <div key={field.id} className="field-container" style={{ marginBottom: isCompact ? '15px' : '20px' }}>
            {renderField(field)}
            
            {/* Render conditional fields if they exist */}
            {field.conditionalFields && formData[field.id] && 
              renderConditionalFields(field, formData[field.id])
            }
          </div>
        ))}
      </div>

      {/* Section Footer - Progress indicator in compact mode */}
      {isCompact && (
        <div className="section-footer" style={{
          marginTop: '15px',
          paddingTop: '10px',
          borderTop: '1px solid #F1F5F9'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {section.fields.filter(f => formData[f.id] && formData[f.id] !== '').length} of {section.fields.length} completed
            </span>
            <div style={{
              width: '40px',
              height: '4px',
              backgroundColor: '#E2E8F0',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(section.fields.filter(f => formData[f.id] && formData[f.id] !== '').length / section.fields.length) * 100}%`,
                height: '100%',
                backgroundColor: '#10B981',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionRenderer;
