import React from 'react';
import { Card, CardMedia, CardContent, Typography, Button, Chip, Box } from '@mui/material';

export default function ServiceCard({ service, onBook }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 3 }}>
      {service.image_url && (
        <CardMedia
          component="img"
          height="200"
          image={service.image_url}
          alt={service.title}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Chip label={service.category} color="primary" size="small" />
          <Typography variant="caption" color="text.secondary">
            {service.pricing_type === 'per_person' ? 'Per Person' : 'Flat Rate'}
          </Typography>
        </Box>
        <Typography gutterBottom variant="h6" component="div">
          {service.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {service.description}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
          R{service.base_price}
        </Typography>
        <Button variant="contained" color="secondary" onClick={() => onBook(service)}>
          Reserve
        </Button>
      </Box>
    </Card>
  );
}