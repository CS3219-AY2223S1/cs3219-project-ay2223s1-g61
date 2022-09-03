import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import useAuth from 'src/hooks/useAuth';
import { isEmpty } from 'lodash';

function SignupPage() {
  const { registerUser, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMsg, setDialogMsg] = useState<string[]>([]);

  const handleSignup = async (e) => {
    e.preventDefault();
    await registerUser({ username, password });
  };

  const closeDialog = () => setIsDialogOpen(false);

  const setErrorDialog = (msgs: string[]) => {
    setIsDialogOpen(true);
    setDialogTitle('Error');
    setDialogMsg(msgs);
  };

  useEffect(() => {
    if (!isEmpty(error)) {
      setErrorDialog(error);
    }
  }, [error]);

  return (
    <Box display={'flex'} flexDirection={'column'} width={'30%'}>
      <Typography variant={'h3'} marginBottom={'2rem'}>
        Sign Up
      </Typography>
      <TextField label="Username" variant="standard" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ marginBottom: '1rem' }} autoFocus />
      <TextField
        label="Password"
        variant="standard"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ marginBottom: '2rem' }}
      />
      <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}>
        <Button variant={'outlined'} onClick={handleSignup}>
          Sign up
        </Button>
      </Box>

      <Dialog open={isDialogOpen} onClose={closeDialog}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {dialogMsg.map((msg) => {
            return <DialogContentText>{msg}</DialogContentText>;
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SignupPage;
