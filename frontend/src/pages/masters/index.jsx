import { MasterManagement } from './MasterManagement';

export const CategoryList = () => (
    <MasterManagement
        type="categories"
        title="Categories"
        fields={[
            { name: 'name', label: 'Name', required: true, placeholder: 'e.g. Tablet, Syrup' },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Category details...' }
        ]}
    />
);

export const BrandList = () => (
    <MasterManagement
        type="brands"
        title="Brands"
        fields={[
            { name: 'name', label: 'Name', required: true, placeholder: 'e.g. Pfizer, GSK' },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Brand details...' }
        ]}
    />
);

export const SellerList = () => (
    <MasterManagement
        type="sellers"
        title="Suppliers"
        fields={[
            { name: 'name', label: 'Name', required: true, placeholder: 'Supplier/Vendor name' },
            { name: 'contactNumber', label: 'Contact', placeholder: 'Phone number' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'Email address' },
            { name: 'address', label: 'Address', type: 'textarea', placeholder: 'Full address' }
        ]}
    />
);
