import Select from 'react-select'

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  isDisabled = false,
  isClearable = false,
  isLoading = false,
  className = '',
  name,
  id,
  required = false,
  ...props
}) {
  const selectedOption =
    options.find((opt) => String(opt.value) === String(value)) ||
    (typeof value === 'object' && value !== null ? value : null)

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '36px',
      height: '36px',
      fontSize: '12px',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#1e293b' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 1px #1e293b' : 'none',
      backgroundColor: state.isDisabled ? '#f8fafc' : '#ffffff',
      '&:hover': {
        borderColor: state.isFocused ? '#1e293b' : '#94a3b8',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 8px',
      height: '34px',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      fontSize: '12px',
      color: '#0f172a',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '12px',
    }),
    singleValue: (base) => ({
      ...base,
      color: '#0f172a',
      fontSize: '12px',
    }),
    menu: (base) => ({
      ...base,
      fontSize: '12px',
      zIndex: 99999,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e2e8f0',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#1e293b'
        : state.isFocused
        ? '#f1f5f9'
        : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#1e293b',
      cursor: 'pointer',
      padding: '8px 12px',
      '&:active': {
        backgroundColor: '#e2e8f0',
      },
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '4px',
      color: '#64748b',
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: '4px',
      color: '#64748b',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: '#e2e8f0',
      margin: '6px 0',
    }),
  }

  return (
    <div className={`relative ${className}`}>
      <Select
        id={id}
        name={name}
        options={options}
        value={selectedOption}
        onChange={(selected) => {
          if (onChange) {
            onChange(selected ? selected.value : '')
          }
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isLoading={isLoading}
        styles={customStyles}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
        noOptionsMessage={() => 'Tidak ada pilihan ditemukan'}
        loadingMessage={() => 'Memuat data...'}
        {...props}
      />
      {required && !value && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute', bottom: 0 }}
          value={value || ''}
          onChange={() => {}}
          required={required}
        />
      )}
    </div>
  )
}
