import type { NoteSection, QuizQuestion } from "@/lib/api";

/**
 * Canned session used by the "Try Demo" button. Lets the full UI
 * (notes time tracker, voice listen counter, 10-question quiz, SessionReport)
 * be exercised without a working video upload pipeline.
 */

export const demoNotes: NoteSection[] = [
  {
    title: "Lecture Overview",
    content: [
      "This demo lecture introduces the core ideas of neural networks.",
      "The material covers architecture, training, and common pitfalls.",
      "By the end you should be able to explain how a network learns from data.",
    ],
  },
  {
    title: "What is a Neural Network",
    content: [
      "A neural network is a stack of layers made of simple units called neurons.",
      "Each neuron computes a weighted sum of its inputs and applies an activation function.",
      "Stacking many layers lets the network learn complex, non-linear patterns.",
      "Common architectures include feed-forward, convolutional, and recurrent networks.",
    ],
  },
  {
    title: "How Networks Learn",
    content: [
      "Training adjusts the weights so the network's output matches the labels.",
      "A loss function quantifies the gap between prediction and truth.",
      "Backpropagation computes gradients of the loss with respect to every weight.",
      "Gradient descent uses those gradients to update weights in small steps.",
    ],
  },
  {
    title: "Activation Functions",
    content: [
      "ReLU is the default choice for hidden layers in modern networks.",
      "Sigmoid and tanh are older choices that suffer from vanishing gradients.",
      "Softmax converts raw scores into a probability distribution for classification.",
      "Choosing the right activation matters more than people realise.",
    ],
  },
  {
    title: "Key Takeaways",
    content: [
      "Neural networks are universal function approximators.",
      "Loss + gradient + weight update is the heart of training.",
      "Architecture choice should match the structure of your data.",
      "Always validate on data the model has never seen during training.",
    ],
  },
];

export const demoQuiz: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the primary purpose of an activation function?",
    options: [
      { id: "A", text: "To introduce non-linearity into the network" },
      { id: "B", text: "To reduce the number of parameters" },
      { id: "C", text: "To compress the input data" },
      { id: "D", text: "To replace the loss function" },
    ],
    correct_answer: "A",
    explanation: "Without non-linearity a stack of layers collapses into a single linear transformation.",
  },
  {
    id: 2,
    question: "Which algorithm computes gradients through a network?",
    options: [
      { id: "A", text: "K-means clustering" },
      { id: "B", text: "Backpropagation" },
      { id: "C", text: "Principal Component Analysis" },
      { id: "D", text: "Bubble sort" },
    ],
    correct_answer: "B",
    explanation: "Backpropagation applies the chain rule of calculus to compute gradients efficiently.",
  },
  {
    id: 3,
    question: "What does the loss function measure?",
    options: [
      { id: "A", text: "The size of the dataset" },
      { id: "B", text: "How fast training runs" },
      { id: "C", text: "The gap between prediction and truth" },
      { id: "D", text: "The number of neurons" },
    ],
    correct_answer: "C",
    explanation: "Smaller loss means predictions are closer to the labels.",
  },
  {
    id: 4,
    question: "Which activation is the default for hidden layers today?",
    options: [
      { id: "A", text: "Sigmoid" },
      { id: "B", text: "Tanh" },
      { id: "C", text: "Softmax" },
      { id: "D", text: "ReLU" },
    ],
    correct_answer: "D",
    explanation: "ReLU is cheap to compute and avoids the vanishing gradient problem.",
  },
  {
    id: 5,
    question: "What does softmax produce?",
    options: [
      { id: "A", text: "A probability distribution" },
      { id: "B", text: "A single binary label" },
      { id: "C", text: "The gradient of the loss" },
      { id: "D", text: "A list of weights" },
    ],
    correct_answer: "A",
    explanation: "Softmax exponentiates scores and normalises them so they sum to 1.",
  },
  {
    id: 6,
    question: "Gradient descent updates weights by moving them in which direction?",
    options: [
      { id: "A", text: "The direction that increases the loss" },
      { id: "B", text: "The direction of the gradient" },
      { id: "C", text: "Opposite to the gradient" },
      { id: "D", text: "Randomly each step" },
    ],
    correct_answer: "C",
    explanation: "We subtract the gradient (scaled by the learning rate) to descend the loss surface.",
  },
  {
    id: 7,
    question: "Why is non-linearity important in neural networks?",
    options: [
      { id: "A", text: "It makes training faster" },
      { id: "B", text: "It lets the model learn complex patterns" },
      { id: "C", text: "It removes the need for data" },
      { id: "D", text: "It reduces memory usage" },
    ],
    correct_answer: "B",
    explanation: "Linear models can only represent linear functions; non-linearity unlocks expressive power.",
  },
  {
    id: 8,
    question: "What does validation data check?",
    options: [
      { id: "A", text: "That the loss is positive" },
      { id: "B", text: "Generalisation to unseen data" },
      { id: "C", text: "The training speed" },
      { id: "D", text: "The size of the network" },
    ],
    correct_answer: "B",
    explanation: "Validation tells you whether the model memorised the training set or actually learned.",
  },
  {
    id: 9,
    question: "Which network type is most common for image data?",
    options: [
      { id: "A", text: "Recurrent network" },
      { id: "B", text: "Convolutional network" },
      { id: "C", text: "Decision tree" },
      { id: "D", text: "Linear regression" },
    ],
    correct_answer: "B",
    explanation: "Convolutions exploit spatial locality and translation invariance in images.",
  },
  {
    id: 10,
    question: "What happens if the learning rate is set too high?",
    options: [
      { id: "A", text: "Training stalls completely" },
      { id: "B", text: "The loss can overshoot and diverge" },
      { id: "C", text: "The model becomes more accurate" },
      { id: "D", text: "Backpropagation is skipped" },
    ],
    correct_answer: "B",
    explanation: "Large updates can jump past the minimum, causing the loss to oscillate or explode.",
  },
];

// served by Vite from /public/demo-audio.wav
export const demoAudioUrl = "/demo-audio.wav";

export const demoTaskId = "demo-session";
